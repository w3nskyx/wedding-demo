import csv, io, os, sqlite3
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from secrets import compare_digest
from typing import Literal
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from pydantic import BaseModel, Field, field_validator

DB_PATH=Path(os.getenv('DATABASE_PATH','./data/rsvp.sqlite3'))
ADMIN_USER=os.getenv('ADMIN_USER','admin'); ADMIN_PASSWORD=os.getenv('ADMIN_PASSWORD','')
ORIGINS=[x.strip() for x in os.getenv('ALLOWED_ORIGINS','').split(',') if x.strip()]
WEDDINGS={'musya-matusevich':'Муся & Матусевич'}
FOOD={'Мясо','Рыба'}; DRINKS={'Вино','Игристое','Крепкое','Без алкоголя'}
app=FastAPI(title='Wedding RSVP API',docs_url=None,redoc_url=None)
app.add_middleware(CORSMiddleware,allow_origins=ORIGINS,allow_credentials=False,allow_methods=['GET','POST'],allow_headers=['Content-Type','Authorization'])
security=HTTPBasic()

class RSVP(BaseModel):
    weddingId:str=Field(min_length=1,max_length=80); id:str=Field(min_length=1,max_length=100); createdAt:str=Field(min_length=1,max_length=50)
    name:str=Field(min_length=1,max_length=160); attendance:Literal['Да, буду','К сожалению, нет']; guests:int=Field(ge=1,le=30)
    food:list[str]=Field(default_factory=list,max_length=2); drinks:list[str]=Field(default_factory=list,max_length=4); comment:str=Field(default='',max_length=1000)
    @field_validator('name','comment')
    @classmethod
    def clean(cls,v): return v.strip()
    @field_validator('food')
    @classmethod
    def food_ok(cls,v):
        if any(x not in FOOD for x in v): raise ValueError('unknown food option')
        return list(dict.fromkeys(v))
    @field_validator('drinks')
    @classmethod
    def drinks_ok(cls,v):
        if any(x not in DRINKS for x in v): raise ValueError('unknown drink option')
        return list(dict.fromkeys(v))

def connect():
    DB_PATH.parent.mkdir(parents=True,exist_ok=True); c=sqlite3.connect(DB_PATH); c.row_factory=sqlite3.Row; return c

def init_db():
    with connect() as c:
        c.execute('''CREATE TABLE IF NOT EXISTS rsvp_responses(id INTEGER PRIMARY KEY AUTOINCREMENT,response_id TEXT NOT NULL,wedding_id TEXT NOT NULL,client_created_at TEXT NOT NULL,received_at TEXT NOT NULL,name TEXT NOT NULL,attendance TEXT NOT NULL,guests INTEGER NOT NULL,food TEXT NOT NULL,drinks TEXT NOT NULL,comment TEXT NOT NULL,UNIQUE(wedding_id,response_id))''')
        c.execute('CREATE INDEX IF NOT EXISTS idx_rsvp_wedding ON rsvp_responses(wedding_id,received_at DESC)')
@app.on_event('startup')
def startup(): init_db()

def auth(x:HTTPBasicCredentials=Depends(security)):
    if not ADMIN_PASSWORD: raise HTTPException(503,'ADMIN_PASSWORD is not configured')
    if not (compare_digest(x.username,ADMIN_USER) and compare_digest(x.password,ADMIN_PASSWORD)):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED,'Unauthorized',headers={'WWW-Authenticate':'Basic'})

@app.get('/health')
def health(): return {'ok':True}
@app.post('/api/rsvp',status_code=201)
def save(p:RSVP):
    if p.weddingId not in WEDDINGS: raise HTTPException(404,'Unknown wedding')
    with connect() as c:
        try: c.execute('INSERT INTO rsvp_responses(response_id,wedding_id,client_created_at,received_at,name,attendance,guests,food,drinks,comment) VALUES(?,?,?,?,?,?,?,?,?,?)',(p.id,p.weddingId,p.createdAt,datetime.now(timezone.utc).isoformat(),p.name,p.attendance,p.guests,'|'.join(p.food),'|'.join(p.drinks),p.comment))
        except sqlite3.IntegrityError: return {'ok':True,'duplicate':True}
    return {'ok':True}
def rows(w):
    if w not in WEDDINGS: raise HTTPException(404,'Unknown wedding')
    with connect() as c: return c.execute('SELECT * FROM rsvp_responses WHERE wedding_id=? ORDER BY received_at DESC',(w,)).fetchall()
@app.get('/admin',response_class=HTMLResponse)
def admin(wedding:str=Query('musya-matusevich'),_=Depends(auth)):
    rs=rows(wedding); yes=[r for r in rs if r['attendance']=='Да, буду']; people=sum(r['guests'] for r in yes)
    opts=''.join(f'<option value="{escape(k)}" {"selected" if k==wedding else ""}>{escape(v)}</option>' for k,v in WEDDINGS.items())
    trs=''.join('<tr>'+''.join(f'<td>{escape(str(v or "—"))}</td>' for v in [r['name'],r['attendance'],r['guests'],r['food'].replace('|',', '),r['drinks'].replace('|',', '),r['comment'],r['received_at']])+'</tr>' for r in rs)
    return f'''<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RSVP</title><style>body{{font-family:Arial;background:#f2eee8;padding:30px;color:#222}}.wrap{{max-width:1100px;margin:auto}}h1{{font-family:Georgia;font-weight:400;font-size:46px}}.stats{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:22px 0}}.card{{background:white;padding:18px;border-radius:14px}}.card b{{font-size:28px;display:block}}.table{{overflow:auto;border-radius:14px}}table{{width:100%;border-collapse:collapse;background:white}}th,td{{text-align:left;padding:11px;border-bottom:1px solid #eee;font-size:14px}}a,select{{padding:10px 14px;border-radius:999px}}a{{background:#222;color:white;text-decoration:none}}@media(max-width:720px){{body{{padding:16px}}h1{{font-size:36px}}}}</style></head><body><div class="wrap"><h1>Ответы гостей</h1><form><select name="wedding" onchange="this.form.submit()">{opts}</select></form><div class="stats"><div class="card"><b>{len(rs)}</b>ответов</div><div class="card"><b>{len(yes)}</b>придут</div><div class="card"><b>{people}</b>гостей всего</div></div><p><a href="/admin/export.csv?wedding={escape(wedding)}">Скачать CSV</a></p><div class="table"><table><thead><tr><th>Имя</th><th>Ответ</th><th>Кол-во</th><th>Еда</th><th>Напитки</th><th>Комментарий</th><th>Получено</th></tr></thead><tbody>{trs}</tbody></table></div></div></body></html>'''
@app.get('/admin/export.csv')
def export(wedding:str=Query('musya-matusevich'),_=Depends(auth)):
    b=io.StringIO(); w=csv.writer(b); w.writerow(['Имя','Ответ','Гостей','Еда','Напитки','Комментарий','Получено'])
    for r in rows(wedding): w.writerow([r['name'],r['attendance'],r['guests'],r['food'].replace('|','; '),r['drinks'].replace('|','; '),r['comment'],r['received_at']])
    data=('\ufeff'+b.getvalue()).encode(); return StreamingResponse(iter([data]),media_type='text/csv; charset=utf-8',headers={'Content-Disposition':f'attachment; filename="rsvp-{wedding}.csv"'})
