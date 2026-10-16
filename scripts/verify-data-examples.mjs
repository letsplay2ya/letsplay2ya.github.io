import {execFileSync} from 'node:child_process';
const python=process.env.PYTHON||'python';
const options={encoding:'utf8',windowsHide:true,env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}};
for(const args of [
 ['-B','-m','unittest','discover','-s','public/examples/csv-quality','-p','test_*.py'],
 ['-B','public/examples/numpy/copies.py'],
 ['-B','public/examples/plotly/export_chart.py'],
]) console.log(execFileSync(python,args,options));
