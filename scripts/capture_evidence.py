"""Run actual curl requests against a local server and save their commands/output."""
import argparse
import json
import os
from pathlib import Path
import shlex
import subprocess
import tempfile

parser = argparse.ArgumentParser()
parser.add_argument('--base', default='http://127.0.0.1:8000')
parser.add_argument('--username', default='sampath_demo')
parser.add_argument('--password', default=os.getenv('DEMO_PASSWORD'))
args = parser.parse_args()
if not args.password:
    parser.error('Set DEMO_PASSWORD or pass --password for your local test account.')
if not args.base.startswith(('http://127.0.0.1:', 'http://localhost:')):
    parser.error('This evidence script uses a local-only demo account. Capture deployed evidence separately.')
dest = Path(__file__).resolve().parents[1] / 'evidence'
dest.mkdir(exist_ok=True)
cookie = Path(tempfile.gettempdir()) / 'cars-dealership-evidence.cookies'
curl = 'curl.exe' if os.name == 'nt' else 'curl'

def run(arguments):
    result = subprocess.run([curl, '--silent', '--show-error', '--fail-with-body', *arguments], capture_output=True, text=True, check=True)
    return result.stdout

def capture(name, arguments):
    output = run(arguments)
    command = 'curl ' + ' '.join(shlex.quote(str(s)) for s in arguments)
    (dest / name).write_text('$ ' + command + '\n\n' + output + '\n', encoding='utf-8')
    print(name + ': captured HTTP response')

token = json.loads(run(['-c', str(cookie), args.base + '/djangoapp/csrf']))['csrfToken']
capture('loginuser', ['-b', str(cookie), '-c', str(cookie), '-X','POST','-H','Content-Type: application/json','-H','X-CSRFToken: ' + token,'-d', json.dumps({'username':args.username,'password':args.password}),args.base + '/djangoapp/login'])
token = json.loads(run(['-b',str(cookie),'-c',str(cookie),args.base + '/djangoapp/csrf']))['csrfToken']
capture('logoutuser', ['-b',str(cookie),'-c',str(cookie),'-X','POST','-H','X-CSRFToken: ' + token,args.base + '/djangoapp/logout'])
for name, endpoint in [('getdealerreviews','reviews/dealer/1'),('getalldealers','get_dealers'),('getdealerbyid','dealer/1'),('getdealersbyState','get_dealers/Kansas'),('getallcarmakes','get_cars'),('analyzereview','analyze/Fantastic%20services')]:
    capture(name,[args.base+'/djangoapp/'+endpoint])
cookie.unlink(missing_ok=True)
