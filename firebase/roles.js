//==========================================================
// SIGEDIS
// Gestión de Roles
//==========================================================

export const ROLES = {

    ADMIN: "admin",

    DOCENTE: "docente"

};

//==========================================================

export function esAdministrador(usuario){

    return usuario?.rol === ROLES.ADMIN;

}

//==========================================================

export function esDocente(usuario){

    return usuario?.rol === ROLES.DOCENTE;

}

//==========================================================

export function puedeVerMenu(rolMenu, rolUsuario){

    if(rolMenu === "both"){

        return true;

    }

    return rolMenu === rolUsuario;

}

//==========================================================

export function aplicarPermisosMenu(rolUsuario){

    const items = document.querySelectorAll("[data-role]");

    items.forEach(item=>{

        const rolMenu = item.dataset.role;

        if(puedeVerMenu(rolMenu,rolUsuario)){

            item.style.display = "";

        }else{

            item.style.display = "none";

        }

    });

}