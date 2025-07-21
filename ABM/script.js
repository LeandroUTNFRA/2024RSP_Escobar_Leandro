
class Persona {
    id;
    nombre;
    apellido;
    fechaNacimiento;

    constructor(id, nombre, apellido, fechaNacimiento) {
        this.id = id;
        this.nombre = nombre;
        this.apellido = apellido;
        this.fechaNacimiento = fechaNacimiento;
    }

    toString() {
        return `ID: ${this.id}, Nombre: ${this.nombre}, Apellido: ${this.apellido}, fechaNacimiento: ${this.fechaNacimiento}`;
    }
}

class Ciudadano extends Persona {
    dni;

    constructor(id, nombre, apellido, fechaNacimiento, dni) {
        super(id, nombre, apellido, fechaNacimiento);
        this.dni = dni;
        
    }

    toString() {
        return `${super.toString()}, dni: ${this.dni}`;
    }
}

class Extranjero extends Persona {
    paisOrigen;

    constructor(id, nombre, apellido, fechaNacimiento, paisOrigen) {
        super(id, nombre, apellido, fechaNacimiento);
        this.paisOrigen = paisOrigen;
        
    }

    toString() {
        return `${super.toString()}, paisOrigen: ${this.paisOrigen}`;
    }
}

function mostrarSpinner(){
    document.getElementById("spinner").style.display = "flex";
}

function ocultarSpinner(){
    document.getElementById("spinner").style.display = "none";
}

let modoOperacion = "agregar";

function cambiarFormulario(modo = "agregar"){
    mostrarSpinner();
    habilitarCampos();
    modoOperacion = modo;

    let formularioLista = document.getElementById("formLista");
    let formularioAbm = document.getElementById("formABM");

    setTimeout(()=>{
        if(formularioLista.style.display === "none"){
            formularioLista.style.display = "block";
            formularioAbm.style.display = "none";
            limpiarCampos();
        } else {
            formularioLista.style.display = "none";
            formularioAbm.style.display = "block";
            if(modo === "modificar"){
                document.getElementById("labelTituloAbm").textContent = "Modificar Persona";
            } else if (modo === "eliminar"){
                document.getElementById("labelTituloAbm").textContent = "Eliminar Persona";
            } else {
                document.getElementById("labelTituloAbm").textContent = "Agregar Persona";
            }
        }

        if(modo === "cancelar"){
            limpiarCampos();
        }

        ocultarSpinner();
    }, 500);        
}

let listaPersonas = [];

function cargarPersonas(){
    mostrarSpinner();
    var xhttp = new XMLHttpRequest();
    let url = 'https://examenesutn.vercel.app/api/PersonaCiudadanoExtranjero';
    xhttp.open("GET", url);
    xhttp.send();
    xhttp.onreadystatechange = function(){
        if(xhttp.readyState === 4){    
            ocultarSpinner();            
            if(xhttp.status === 200){
                let jsonRespuesta = JSON.parse(xhttp.responseText);
                if(listaPersonas.length === 0){
                    listaPersonas = jsonRespuesta.map(persona =>{
                        if(persona.dni !== undefined ){
                            return new Ciudadano(persona.id, persona.nombre, persona.apellido, persona.fechaNacimiento, persona.dni);
                        } else if (persona.paisOrigen !== undefined ){
                            return new Extranjero(persona.id, persona.nombre, persona.apellido, persona.fechaNacimiento, persona.paisOrigen);
                        }
                    });
                }
                mostrarlistaPersonas();
            } else {
                alert ("No se pudo cargar: " + url + "\nError: " +xhttp.status);
            }
        }
    }
}

function mostrarlistaPersonas(){
    let tablaLista = document.getElementById("tbodyLista");
    tablaLista.innerHTML = "";

    listaPersonas.forEach(persona =>{
        let fila = tablaLista.insertRow();

        fila.insertCell().innerHTML = persona.id;
        fila.insertCell().innerHTML = persona.nombre;
        fila.insertCell().innerHTML = persona.apellido;
        fila.insertCell().innerHTML = persona.fechaNacimiento;
        fila.insertCell().innerHTML = persona instanceof Ciudadano ? persona.dni : "--";
        fila.insertCell().innerHTML = persona instanceof Extranjero ? persona.paisOrigen : "--";            
        fila.insertCell().innerHTML = `<button class="btnLista" onclick="mostrarDatosAModificar(${persona.id})">Modificar</button>`;            
        fila.insertCell().innerHTML = `<button class="btnLista" onclick="mostrarDatosAEliminar(${persona.id})">Eliminar</button>`;
    })
}

async function enviarSolicitudPost(persona){
    try{
        mostrarSpinner();
        let url = 'https://examenesutn.vercel.app/api/PersonaCiudadanoExtranjero';
        let respuesta = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type' : 'application/json'},
            body: JSON.stringify(persona)
        });

        if(respuesta.status === 200){
            let contenido = await respuesta.json();
            return contenido;
        } else {
            alert ("Error Status no esperado: " +respuesta.status);
            return false;
        }
    } catch(error){
        alert("Error al conectarse con " + url);
        return false;
    }
}

async function altaPersona(){
    mostrarSpinner();
    
    let nombre = document.getElementById("txtNombre").value;
    let apellido = document.getElementById("txtApellido").value;
    let fechaNacimiento = document.getElementById("txtFechaNacimiento").value;
    let dni;
    let paisOrigen;

    if(!validarPersona(nombre, fechaNacimiento, apellido)){
        ocultarSpinner();
        return;
    }        

    let persona;

    if(document.getElementById("slTipo").value === "Ciudadano"){
        dni = document.getElementById("txtDni").value; 
        
        if(!validarCiudadano(dni)){
            ocultarSpinner();
            return;
        }

        persona = {nombre, apellido, fechaNacimiento, dni};
        
    } else if(document.getElementById("slTipo").value === "Extranjero"){
        paisOrigen = document.getElementById("txtPaisOrigen").value;
        
        if(!validarExtranjero(paisOrigen)){
            ocultarSpinner();
            return;
        }

        persona = {nombre, apellido, fechaNacimiento, paisOrigen};
    }     
    
    let respuesta = await enviarSolicitudPost(persona);

    if(respuesta){
        persona.id = respuesta.id;

        if(document.getElementById("slTipo").value === "Ciudadano"){
            let ciudadano = new Ciudadano(persona.id, nombre, apellido, fechaNacimiento, dni);
            listaPersonas.push(ciudadano);
        } else {
            let extranjero = new Extranjero(persona.id, nombre, apellido, fechaNacimiento, paisOrigen);
            listaPersonas.push(extranjero);
        }

        cambiarFormulario();
        mostrarlistaPersonas();
    } else {
        ocultarSpinner();
        cambiarFormulario();
        alert ("No se pudo dar de alta");
    }
}

function mostrarDatosAModificar(personaId){
    habilitarCampos();

    let persona;

    listaPersonas.forEach(v =>{
        if(v.id === personaId){
            persona = v;
        }
    })

    if(persona){
        document.getElementById("txtId").value = persona.id;
        document.getElementById("txtNombre").value = persona.nombre;
        document.getElementById("txtApellido").value = persona.apellido;
        document.getElementById("txtFechaNacimiento").value = persona.fechaNacimiento;
        if(persona instanceof Ciudadano){
            document.getElementById("slTipo").value = "Ciudadano";
            document.getElementById("txtDni").value = persona.dni;
        } else if (persona instanceof Extranjero){
            document.getElementById("slTipo").value = "Extranjero";
            document.getElementById("txtPaisOrigen").value = persona.paisOrigen;
        }
        cambiarFormulario("modificar");
        document.getElementById("btnAceptar").onclick = () => modificarPersona(persona);            
    } else {
        alert ("persona no encontrado");
    }
}

function enviarSolicitudPut(persona){
    let url = 'https://examenesutn.vercel.app/api/PersonaCiudadanoExtranjero';
    return fetch(url, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(persona)
    })
    .then(respuesta =>{
        if(respuesta.status === 200){
            return true;
        } else{
            alert ("No se pudo cargar: " + url + "\nError: " +respuesta.status);
            cambiarFormulario();
            return false; 
        }
    })
    .catch(error =>{
        alert(error.message);
        cambiarFormulario();
        return false;
    })
}



function modificarPersona(persona){
    mostrarSpinner();
    enviarSolicitudPut(persona)
    .then(
        respuesta => {
            if(respuesta){
                let nombre = document.getElementById("txtNombre").value;
                let apellido = document.getElementById("txtApellido").value;
                let fechaNacimiento = document.getElementById("txtFechaNacimiento").value;
                
                if(!validarPersona(nombre,  fechaNacimiento,apellido)){
                    ocultarSpinner();
                    return;
                }

                let nuevaPersona;
                if(document.getElementById("slTipo").value === "Ciudadano"){
                    let dni = document.getElementById("txtDni").value;

                    if(!validarCiudadano(dni)){
                        ocultarSpinner();
                        return;
                    }

                    nuevaPersona = new Ciudadano(persona.id, nombre, apellido, fechaNacimiento, dni);
                } else if(document.getElementById("slTipo").value ==="Extranjero"){
                    let paisOrigen = document.getElementById("txtPaisOrigen").value;

                    if(!validarExtranjero(paisOrigen)){
                        ocultarSpinner();
                        return;
                    }

                    nuevaPersona = new Extranjero(persona.id, nombre, apellido, fechaNacimiento, paisOrigen);     
                }
                let index = listaPersonas.findIndex(v => v.id === persona.id);
                if (index !== -1) {
                    listaPersonas[index] = nuevaPersona;
                }
                
                cambiarFormulario();
                mostrarlistaPersonas();
                document.getElementById("btnAceptar").onclick = null;
            } else {
                mostrarlistaPersonas();
                document.getElementById("btnAceptar").onclick = null;
            }
        }
    )
    .catch(error =>{
        alert("Error: " + error.message);
        ocultarSpinner();
        cambiarFormulario();
        mostrarlistaPersonas();
    })   
}


function mostrarDatosAEliminar(personaId){

    let persona;
    listaPersonas.forEach(v =>{
        if(v.id === personaId){
            persona = v;
        }
    })

    if(persona){
        document.getElementById("txtId").value = persona.id;
        document.getElementById("txtNombre").value = persona.nombre;
        document.getElementById("txtNombre").disabled = true;
        document.getElementById("txtApellido").value = persona.apellido;
        document.getElementById("txtApellido").disabled = true;
        document.getElementById("txtFechaNacimiento").value = persona.fechaNacimiento;
        document.getElementById("txtFechaNacimiento").disabled = true;            
        if(persona instanceof Ciudadano){
            document.getElementById("slTipo").value = "Ciudadano";
            document.getElementById("slTipo").disabled = true;
            document.getElementById("txtDni").value = persona.dni;
            document.getElementById("txtDni").disabled = true;
        } else if (persona instanceof Extranjero){
            document.getElementById("slTipo").value = "Extranjero";
            document.getElementById("slTipo").disabled = true;
            document.getElementById("txtPaisOrigen").value = persona.paisOrigen;
            document.getElementById("txtPaisOrigen").disabled = true;
        }
        cambiarFormulario("eliminar");
        bloquearTodosLosCampos();
        document.getElementById("btnAceptar").onclick = () => enviarSolicitudDelete(personaId);
    } else {
        alert("persona no encontrado");
    }
}

async function enviarSolicitudDelete(personaId){
    try{
        mostrarSpinner();
        let url = 'https://examenesutn.vercel.app/api/PersonaCiudadanoExtranjero';
        let respuesta = await fetch (url, {
            method: 'DELETE',
            headers:{'Content-Type': 'application/json'},
            body: JSON.stringify({id: personaId})
        });
        
        if(respuesta.status === 200){
            if(confirm("¿Seguro que desea Eliminar esta persona?")){
                listaPersonas = listaPersonas.filter(v => v.id !== personaId);
                cambiarFormulario();
                mostrarlistaPersonas();
            } else {
                cambiarFormulario();
            }                
        } else{
            cambiarFormulario();
            mostrarlistaPersonas();                
            alert("Error status no esperado: " + respuesta.status);
        }
    } catch(error){
        alert("No pudo conectarse con " + url + "\nError: "+error.message);
    }
}

function bloquearTodosLosCampos(){
    document.getElementById("txtNombre").disabled = true;
    document.getElementById("txtApellido").disabled = true;
    document.getElementById("txtFechaNacimiento").disabled = true;
    document.getElementById("txtDni").disabled = true;
    document.getElementById("txtPaisOrigen").disabled = true;
    document.getElementById("slTipo").disabled = true;
}


function habilitarCampos(){
    let tipoSeleccionado = document.getElementById("slTipo").value;
    document.getElementById("txtNombre").disabled = false;
    document.getElementById("txtApellido").disabled = false;
    document.getElementById("txtFechaNacimiento").disabled = false;
    document.getElementById("slTipo").disabled = false;

    if(tipoSeleccionado === "Ciudadano"){
        document.getElementById("txtDni").disabled = false;
        document.getElementById("txtPaisOrigen").disabled = true;
        document.getElementById("txtPaisOrigen").value = "";
        
    } else if (tipoSeleccionado === "Extranjero"){
        document.getElementById("txtDni").disabled = true;
        document.getElementById("txtPaisOrigen").disabled = false;
        document.getElementById("txtDni").value = "";
         
    }
}
function limpiarCampos(){
    document.getElementById("txtId").value = "";
    document.getElementById("txtNombre").value = "";
    document.getElementById("txtApellido").value = "";
    document.getElementById("txtFechaNacimiento").value = "";
    document.getElementById("txtDni").value = "";
    document.getElementById("txtPaisOrigen").value = "";
}

function validarPersona(nombre, fecha, apellido){
    if (!nombre || !apellido) {
        alert("Nombre o apellido incompleto");
        return false;
    }

    if (!/^\d{8}$/.test(fecha)) {
        alert("El formato de la fecha debe ser AAAAMMDD y contener solo números.");
        return false;
    }

    const año = parseInt(fecha.substring(0, 4), 10);
    const mes = parseInt(fecha.substring(4, 6), 10);
    const dia = parseInt(fecha.substring(6, 8), 10);

    const fechaObj = new Date(año, mes - 1, dia);

    if (
        fechaObj.getFullYear() !== año ||
        fechaObj.getMonth() + 1 !== mes ||
        fechaObj.getDate() !== dia
    ) {
        alert("La fecha no es válida.");
        return false;
    }

    return true;
}

function validarCiudadano(dni){
    if(isNaN(dni) || dni <= 0){
        alert("dni debe ser mayor a 0");
        return;
    }

    return true;
}

function validarExtranjero(paisOrigen){
    if(!paisOrigen){
        alert("Pais de Origen incompleto");
        return;
    }

    return true;
}

window.onload = function(){
    document.getElementById("btnAgregarElemento").addEventListener("click", () => cambiarFormulario("agregar"));
    document.getElementById("btnCancelar").addEventListener("click", () => cambiarFormulario("cancelar"));
    document.getElementById("slTipo").addEventListener("change", habilitarCampos);
    document.getElementById("btnAceptar").addEventListener("click", () => {
        if (modoOperacion === "agregar") {
            altaPersona(); 
        }
    });
    cargarPersonas();
}