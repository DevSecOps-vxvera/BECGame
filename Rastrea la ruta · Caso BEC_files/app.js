(() => {
  const panel = document.querySelector('#game-panel');
  const progressLabel = document.querySelector('#progress-label');
  const stepButtons = [...document.querySelectorAll('.step-dot')];
  const state = {
    step: 0,
    evidence: [], evidenceSubmitted: false,
    transactions: [], transactionsSubmitted: false,
    controls: '', controlsSubmitted: false
  };

  const evidence = [
    { id:'identity', title:'Inicio de sesión y auditoría de identidad', text:'IP y ubicación inusuales, método MFA, riesgo de inicio de sesión, sesiones y cambios de autenticación del analista.', tag:'CLAVE', correct:true },
    { id:'mailbox', title:'Auditoría del buzón y reglas', text:'Creación o modificación de una regla de reenvío, destino externo, mensajes afectados y cambios hechos durante la sesión.', tag:'CLAVE', correct:true },
    { id:'erp', title:'ERP: maestro de proveedor y lote de pagos', text:'Quién cambió la cuenta bancaria, cuándo se aprobó, qué facturas usan el dato y en qué estado están los pagos.', tag:'CLAVE', correct:true },
    { id:'headers', title:'Correo original y encabezados completos', text:'Remitente, ruta, marcas de tiempo y resultados SPF, DKIM y DMARC; útil para correlacionar el hilo y preservar evidencia.', tag:'CONTEXTO', correct:true },
    { id:'edr', title:'Telemetría EDR del equipo del analista', text:'Puede ayudar si el equipo también estuvo comprometido, pero el escenario no muestra aún actividad de malware en el endpoint.', tag:'COMPLEMENTARIA', correct:false },
    { id:'weather', title:'Pronóstico del tiempo de la oficina', text:'No ayuda a explicar el acceso al buzón ni a determinar qué pagos dependen del dato bancario modificado.', tag:'NO PERTINENTE', correct:false }
  ];
  const transactions = [
    { id:'invoice-a', vendor:'Comercial Andina Ltda. · factura CA-481', amount:'$48.600', info:'Pago pendiente. Usa la cuenta bancaria que fue modificada en el maestro del proveedor.', risk:true },
    { id:'invoice-b', vendor:'Comercial Andina Ltda. · factura CA-492', amount:'$18.200', info:'Segundo pago pendiente al mismo proveedor; el mismo cambio de cuenta lo afecta.', risk:true },
    { id:'other-vendor', vendor:'Suministros del Pacífico · factura SP-118', amount:'$9.700', info:'Proveedor y cuenta bancaria distintos; no hay evidencia de cambios en su registro.', risk:false },
    { id:'payroll', vendor:'Nómina quincenal · lote PR-16', amount:'$215.000', info:'Se procesa en un flujo y una cuenta de nómina separados; no aparece afectada por esta ruta.', risk:false }
  ];

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }
  function progress() {
    const done = [state.evidenceSubmitted, state.transactionsSubmitted, state.controlsSubmitted].filter(Boolean).length;
    progressLabel.textContent = `${done} / 3`;
    stepButtons.forEach((button, index) => {
      button.classList.toggle('active', state.step === index);
      button.classList.toggle('done', [state.evidenceSubmitted,state.transactionsSubmitted,state.controlsSubmitted][index]);
      button.disabled = index > done;
      button.setAttribute('aria-current', state.step === index ? 'step' : 'false');
    });
  }
  function go(step) {
    state.step = Math.max(0, Math.min(step, 2));
    progress();
    if (state.step === 0) renderEvidence();
    else if (state.step === 1) renderTransactions();
    else renderControls();
    if (window.matchMedia('(max-width: 650px)').matches) panel.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function header(kicker,title,description) {
    return `<div class="panel-head"><p class="eyebrow">${kicker}</p><h3>${title}</h3><p>${description}</p></div>`;
  }
  function checked(id, list) { return list.includes(id) ? 'checked' : ''; }
  function renderEvidence() {
    panel.innerHTML = header('DECISIÓN 1 · SELECCIONA VARIAS','¿Qué evidencia revisarías primero?','Elige la telemetría que permite confirmar acceso, rastrear cambios y detener los pagos. Envía tu selección para ver cómo se complementan las fuentes.') +
      `<div class="choice-grid">${evidence.map(item=>`<label class="choice ${state.evidence.includes(item.id)?'selected':''}"><input type="checkbox" name="evidence" value="${item.id}" ${checked(item.id,state.evidence)}><span class="choice-tag ${item.correct?'strong':''}">${item.tag}</span><b>${item.title}</b><small>${item.text}</small></label>`).join('')}</div>`+
      `${state.evidenceSubmitted?evidenceFeedback():''}<div class="panel-footer"><p class="hint">Puedes elegir más de una. Relaciona cada fuente con una pregunta del incidente.</p><button class="primary-button" id="submit-evidence" type="button">${state.evidenceSubmitted?'Actualizar análisis':'Analizar evidencia'} →</button></div>`;
    panel.querySelectorAll('[name="evidence"]').forEach(box=>box.addEventListener('change',()=>{state.evidence=[...panel.querySelectorAll('[name="evidence"]:checked')].map(x=>x.value);renderEvidence()}));
    panel.querySelector('#submit-evidence').addEventListener('click',()=>{
      if(!state.evidence.length){showNudge('Selecciona al menos una fuente para iniciar el análisis.');return;}
      state.evidenceSubmitted=true;progress();renderEvidence();
    });
    panel.querySelector('#continue-evidence')?.addEventListener('click',()=>go(1));
  }
  function evidenceFeedback() {
    const selected=evidence.filter(item=>state.evidence.includes(item.id));
    const missing=evidence.filter(item=>item.correct&&!state.evidence.includes(item.id));
    const useful=selected.filter(item=>item.correct).length;
    const irrelevant=selected.filter(item=>!item.correct).length;
    return `<div class="feedback"><h4>${useful===4&&!irrelevant?'Buena correlación.':'Pista para afinar la investigación'}</h4><p>La señal fuerte está en combinar identidad (¿quién inició sesión?), auditoría del buzón (¿qué regla se creó?) y ERP (¿qué pagos adoptaron la cuenta nueva?). Los encabezados ayudan a reconstruir el correo, aunque por sí solos no demuestran que la sesión del analista se haya comprometido.</p>${missing.length?`<p><b>Fuentes clave que faltan:</b> ${missing.map(x=>escapeHtml(x.title)).join('; ')}.</p>`:''}${irrelevant?'<p>EDR es útil si aparecen señales de compromiso del dispositivo; el pronóstico del tiempo no aporta a este caso.</p>':''}<p><b>Correlación de la simulación:</b> inicio de sesión atípico → regla de reenvío externa → cambio del proveedor → pagos aún pendientes. La vía inicial sigue sin confirmarse.</p><div class="panel-footer"><p class="hint">Tu investigación continúa con el alcance de pagos.</p><button class="primary-button" id="continue-evidence" type="button">Revisar transacciones →</button></div></div>`;
  }
  function renderTransactions() {
    panel.innerHTML = header('DECISIÓN 2 · ALCANCE DEL INCIDENTE','¿Qué transacciones pondrías en pausa?','Marca los pagos que usan el registro bancario modificado. Basa la decisión en el vínculo con el proveedor, no solo en el importe.')+
      `<div class="transaction-grid">${transactions.map(item=>`<label class="transaction ${item.risk?'risk':''} ${state.transactions.includes(item.id)?'selected':''}"><input type="checkbox" name="transaction" value="${item.id}" ${checked(item.id,state.transactions)}><span><b>${item.vendor}</b><strong class="amount">${item.amount}</strong><small>${item.info}</small></span></label>`).join('')}</div>`+
      `${state.transactionsSubmitted?transactionFeedback():''}<div class="panel-footer"><p class="hint">En una respuesta real, confirma el estado de liberación y el alcance en el ERP antes de actuar.</p><button class="primary-button" id="submit-transactions" type="button">${state.transactionsSubmitted?'Actualizar alcance':'Evaluar alcance'} →</button></div>`;
    panel.querySelectorAll('[name="transaction"]').forEach(box=>box.addEventListener('change',()=>{state.transactions=[...panel.querySelectorAll('[name="transaction"]:checked')].map(x=>x.value);renderTransactions()}));
    panel.querySelector('#submit-transactions').addEventListener('click',()=>{
      if(!state.transactions.length){showNudge('Selecciona al menos una transacción. También puedes marcar que pondrías en pausa ambas facturas expuestas.');return;}
      state.transactionsSubmitted=true;progress();renderTransactions();
    });
    panel.querySelector('#continue-transactions')?.addEventListener('click',()=>go(2));
  }
  function transactionFeedback() {
    const correct=transactions.filter(item=>item.risk).map(item=>item.id);
    const selectedRisk=state.transactions.filter(id=>correct.includes(id)).length;
    const overreach=state.transactions.filter(id=>!correct.includes(id)).length;
    let title='Alcance por revisar';
    if(selectedRisk===2&&!overreach)title='Alcance bien delimitado';
    else if(selectedRisk===2)title='Protegiste los pagos expuestos, con alcance más amplio';
    else if(selectedRisk===0)title='Los pagos al proveedor siguen expuestos';
    else title='Identificaste solo parte de la exposición';
    return `<div class="feedback"><h4>${title}</h4><p>En esta simulación deben pausarse <b>las dos facturas de Comercial Andina</b>: ambas dependen del mismo registro bancario alterado y siguen pendientes. El pago de otro proveedor y la nómina no muestran relación con esta ruta según la evidencia disponible.</p>${overreach?'<p>Pausar pagos adicionales puede ser una medida temporal, pero valida el alcance con los cambios del ERP para evitar detener procesos no afectados.</p>':''}<p>Si algún pago ya se hubiera liberado, la prioridad sería contactar inmediatamente al banco y activar el procedimiento de recuperación de fondos.</p><div class="panel-footer"><p class="hint">Siguiente: selecciona un paquete y observa su resultado en este caso.</p><button class="primary-button" id="continue-transactions" type="button">Comparar controles →</button></div></div>`;
  }
  function renderControls() {
    panel.innerHTML = header('DECISIÓN 3 · SELECCIONA UN PAQUETE','¿Qué grupo de controles contiene este caso?','Elige el paquete que usarías para responder. Uno reduce algunos riesgos, pero deja abierta una parte de la ruta; el otro combina identidad, correo y pagos.')+
      `<label class="control-option ${state.controls==='partial'?'selected':''}"><input type="radio" name="controls" value="partial" ${state.controls==='partial'?'checked':''}><span><h4>A · Filtro de correo, capacitación anual y MFA por código</h4><p>El flujo permite que una persona modifique datos bancarios y apruebe el lote. No hay alerta para reglas externas ni confirmación independiente del cambio.</p><ul><li>Reduce parte del correo malicioso y mejora la alerta del personal.</li><li>Una sesión válida comprometida todavía puede leer el hilo y crear el reenvío.</li><li>El pago puede pasar con la cuenta alterada; el ataque no queda contenido.</li></ul></span></label>
      <label class="control-option ${state.controls==='complete'?'selected':''}"><input type="radio" name="controls" value="complete" ${state.controls==='complete'?'checked':''}><span><h4>B · Identidad, auditoría de buzón y verificación independiente de pagos</h4><p>El paquete actúa sobre las señales observadas y frena los dos pagos vinculados al dato alterado.</p><ul><li>Exige autenticación resistente al phishing y acceso condicional; al detectar la anomalía, revoca sesiones.</li><li>Alerta sobre reenvíos externos; investiga y elimina la regla, preservando registros.</li><li>Bloquea el cambio bancario hasta confirmarlo con el proveedor en un teléfono ya registrado; exige doble aprobación para liberar pagos.</li></ul></span></label>
      ${state.controlsSubmitted?controlFeedback():''}<div class="panel-footer"><p class="hint">En el juego, el paquete B contiene el escenario antes de que se liberen los pagos. En la realidad, valida que el control exista y funcione.</p><button class="primary-button" id="submit-controls" type="button">${state.controlsSubmitted?'Actualizar decisión':'Ver resultado del caso'} →</button></div>`;
    panel.querySelectorAll('[name="controls"]').forEach(radio=>radio.addEventListener('change',()=>{state.controls=radio.value;renderControls()}));
    panel.querySelector('#submit-controls').addEventListener('click',()=>{
      if(!state.controls){showNudge('Elige uno de los dos grupos de controles para ver el resultado.');return;}
      state.controlsSubmitted=true;progress();renderControls();
    });
    panel.querySelector('#final-reset')?.addEventListener('click',reset);
  }
  function controlFeedback() {
    if(state.controls==='partial')return `<div class="control-result"><h4>Contención incompleta: los pagos siguen en riesgo.</h4><p>El filtro y la capacitación no detienen una sesión cloud válida ya comprometida. El MFA por código tampoco corrige por sí solo la sesión activa. Como el cambio de cuenta no requiere verificación por un canal independiente y una persona puede aprobar el lote, las dos facturas podrían liberarse a la cuenta fraudulenta.</p><p><b>Qué falta:</b> revocar la sesión, retirar la regla de reenvío, congelar ambas facturas, verificar el cambio con el proveedor usando el contacto previamente registrado y exigir doble aprobación.</p>${finalScore()}<div class="panel-footer"><p class="hint">Puedes volver a comparar y elegir el paquete B.</p><button class="secondary-button" id="final-reset" type="button">Reiniciar para probar el otro paquete</button></div></div>`;
    return `<div class="control-result good"><h4>Contención completa del escenario simulado.</h4><p>La alerta de identidad y la regla de reenvío disparan la respuesta: se revocan las sesiones, se elimina la regla y se conserva evidencia. Finanzas pausa los dos pagos del proveedor. La llamada a un número registrado confirma que el cambio no era legítimo; el doble control impide liberar el lote.</p><p><b>Resultado del ejercicio:</b> no se transfiere dinero. Esta conclusión depende de que esos controles estén activos y se ejecuten a tiempo; no garantiza el mismo resultado en todos los incidentes.</p>${finalScore()}<div class="panel-footer"><p class="hint">La ruta se contuvo antes de la liberación de fondos.</p><button class="secondary-button" id="final-reset" type="button">Jugar otra vez</button></div></div>`;
  }
  function finalScore() {
    const hitEvidence=evidence.filter(x=>x.correct&&state.evidence.includes(x.id)).length;
    const hitTransactions=transactions.filter(x=>x.risk&&state.transactions.includes(x.id)).length;
    const extraTransactions=transactions.filter(x=>!x.risk&&state.transactions.includes(x.id)).length;
    const points=Math.round((hitEvidence/4)*35+(hitTransactions/2)*35+(!extraTransactions?10:5)+(state.controls==='complete'?20:0));
    return `<div class="score-result"><span>Resultado orientativo del ejercicio</span><b>${points}/100 · ${hitEvidence}/4 fuentes clave · ${hitTransactions}/2 pagos expuestos</b></div>`;
  }
  function showNudge(message) {
    const previous=panel.querySelector('.nudge');
    if(previous)previous.remove();
    const note=document.createElement('p');note.className='feedback nudge';note.setAttribute('role','status');note.textContent=message;
    panel.insertBefore(note,panel.querySelector('.panel-footer'));
  }
  function reset() {
    state.step=0;state.evidence=[];state.evidenceSubmitted=false;state.transactions=[];state.transactionsSubmitted=false;state.controls='';state.controlsSubmitted=false;
    go(0);
  }
  stepButtons.forEach(button=>button.addEventListener('click',()=>{
    const step=Number(button.dataset.step);
    const allowed=step===0||(step===1&&state.evidenceSubmitted)||(step===2&&state.transactionsSubmitted);
    if(allowed)go(step);
  }));
  document.querySelector('#restart').addEventListener('click',reset);
  go(0);
})();
