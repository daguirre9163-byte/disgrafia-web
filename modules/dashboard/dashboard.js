const fecha=new Date();

const meses=[

"Enero",

"Febrero",

"Marzo",

"Abril",

"Mayo",

"Junio",

"Julio",

"Agosto",

"Septiembre",

"Octubre",

"Noviembre",

"Diciembre"

];

document.getElementById("diaActual").textContent=fecha.getDate();

document.getElementById("mesActual").textContent=meses[fecha.getMonth()];

document.getElementById("anioActual").textContent=fecha.getFullYear();