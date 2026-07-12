export const ROLES = {
    ADMIN: "admin",
    DOCENTE: "docente",
    ESTUDIANTE: "estudiante"
};

const PERMISOS = {
    [ROLES.ADMIN]: ["*"],
    [ROLES.DOCENTE]: [
        "dashboard:ver",
        "cursos:ver",
        "cursos:crear",
        "cursos:editar",
        "estudiantes:ver",
        "estudiantes:crear",
        "estudiantes:editar",
        "estudiantes:eliminar",
        "evaluaciones:ver",
        "evaluaciones:crear",
        "evaluaciones:editar",
        "actividades:ver",
        "actividades:crear"
    ],
    [ROLES.ESTUDIANTE]: [
        "perfil:ver",
        "evaluaciones:ver"
    ]
};

function llavePermiso(accion, recurso) {
    if (!recurso) {
        return accion;
    }

    return `${recurso}:${accion}`;
}

export function tienePermiso(usuario, accion, recurso) {
    const rol = usuario?.rol;

    if (!rol || !PERMISOS[rol]) {
        return false;
    }

    const permisos = PERMISOS[rol];

    if (permisos.includes("*")) {
        return true;
    }

    return permisos.includes(llavePermiso(accion, recurso));
}

export function validarPermiso(usuario, accion, recurso) {
    return tienePermiso(usuario, accion, recurso);
}

export function puedeVerMenu(rolMenu, rolUsuario) {
    if (rolMenu === "both") {
        return true;
    }

    return rolMenu === rolUsuario;
}

export function aplicarPermisosMenu(rolUsuario) {
    const items = document.querySelectorAll("[data-role], [data-permiso]");

    items.forEach((item) => {
        const rolMenu = item.dataset.role;
        const permisoMenu = item.dataset.permiso;

        if (permisoMenu) {
            const [recurso, accion] = permisoMenu.split(":");
            item.style.display = tienePermiso({ rol: rolUsuario }, accion, recurso) ? "" : "none";
            return;
        }

        item.style.display = puedeVerMenu(rolMenu, rolUsuario) ? "" : "none";
    });
}
