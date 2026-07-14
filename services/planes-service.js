import { db } from "../config/firebase-config.js";
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Referencia a la colección
const planesCollection = collection(db, "planesIntervención");

// ==========================================
// CREAR PLAN
// ==========================================

export async function crearPlanServicio(planData) {
    try {
        console.log("📝 Creando nuevo plan:", planData.nombrePlan);
        
        const planConTimestamp = {
            ...planData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            estado: planData.estado || "activo",
            objetivos: planData.objetivos || [],
            actividades: planData.actividades || [],
            registroSeguimiento: planData.registroSeguimiento || []
        };
        
        const docRef = await addDoc(planesCollection, planConTimestamp);
        
        console.log("✅ Plan creado con ID:", docRef.id);
        
        return {
            id: docRef.id,
            ...planConTimestamp
        };
    } catch (error) {
        console.error("❌ Error creando plan:", error);
        throw new Error(`Error al crear plan: ${error.message}`);
    }
}

// ==========================================
// OBTENER PLANES
// ==========================================

export async function obtenerPlanesServicio(filtros = {}) {
    try {
        console.log("📊 Obteniendo planes...");
        
        let q = query(planesCollection, orderBy("createdAt", "desc"));
        
        // Aplicar filtros si existen
        if (filtros.estado) {
            q = query(planesCollection, where("estado", "==", filtros.estado), orderBy("createdAt", "desc"));
        }
        
        if (filtros.tipo) {
            q = query(planesCollection, where("tipo", "==", filtros.tipo), orderBy("createdAt", "desc"));
        }
        
        if (filtros.estado && filtros.tipo) {
            q = query(
                planesCollection,
                where("estado", "==", filtros.estado),
                where("tipo", "==", filtros.tipo),
                orderBy("createdAt", "desc")
            );
        }
        
        const querySnapshot = await getDocs(q);
        
        const planes = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.(),
            updatedAt: doc.data().updatedAt?.toDate?.(),
            fechaInicio: doc.data().fechaInicio,
            fechaTermino: doc.data().fechaTermino
        }));
        
        console.log(`✅ Se obtuvieron ${planes.length} planes`);
        
        return planes;
    } catch (error) {
        console.error("❌ Error obteniendo planes:", error);
        throw new Error(`Error al obtener planes: ${error.message}`);
    }
}

// ==========================================
// OBTENER PLAN POR ID
// ==========================================

export async function obtenerPlanPorIdServicio(planId) {
    try {
        console.log("📋 Obteniendo plan:", planId);
        
        const docRef = doc(planesCollection, planId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error("Plan no encontrado");
        }
        
        const plan = {
            id: docSnap.id,
            ...docSnap.data(),
            createdAt: docSnap.data().createdAt?.toDate?.(),
            updatedAt: docSnap.data().updatedAt?.toDate?.()
        };
        
        console.log("✅ Plan obtenido:", plan.nombrePlan);
        
        return plan;
    } catch (error) {
        console.error("❌ Error obteniendo plan:", error);
        throw new Error(`Error al obtener plan: ${error.message}`);
    }
}

// ==========================================
// ACTUALIZAR PLAN
// ==========================================

export async function actualizarPlanServicio(plan) {
    try {
        console.log("📝 Actualizando plan:", plan.id);
        
        const { id, ...datosActualizacion } = plan;
        
        datosActualizacion.updatedAt = Timestamp.now();
        
        const docRef = doc(planesCollection, id);
        await updateDoc(docRef, datosActualizacion);
        
        console.log("✅ Plan actualizado");
        
        return plan;
    } catch (error) {
        console.error("❌ Error actualizando plan:", error);
        throw new Error(`Error al actualizar plan: ${error.message}`);
    }
}

// ==========================================
// ELIMINAR PLAN
// ==========================================

export async function eliminarPlanServicio(planId) {
    try {
        console.log("🗑️ Eliminando plan:", planId);
        
        const docRef = doc(planesCollection, planId);
        await deleteDoc(docRef);
        
        console.log("✅ Plan eliminado");
    } catch (error) {
        console.error("❌ Error eliminando plan:", error);
        throw new Error(`Error al eliminar plan: ${error.message}`);
    }
}

// ==========================================
// OBJETIVOS
// ==========================================

export async function agregarObjetivoServicio(planId, objetivo) {
    try {
        console.log("🎯 Agregando objetivo al plan:", planId);
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        if (!plan.objetivos) {
            plan.objetivos = [];
        }
        
        const objetivoConId = {
            id: "obj_" + Date.now(),
            ...objetivo,
            createdAt: new Date().toISOString()
        };
        
        plan.objetivos.push(objetivoConId);
        
        await actualizarPlanServicio(plan);
        
        console.log("✅ Objetivo agregado");
        
        return objetivoConId;
    } catch (error) {
        console.error("❌ Error agregando objetivo:", error);
        throw new Error(`Error al agregar objetivo: ${error.message}`);
    }
}

export async function eliminarObjetivoServicio(planId, objetivoId) {
    try {
        console.log("🗑️ Eliminando objetivo:", objetivoId);
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        plan.objetivos = (plan.objetivos || []).filter(obj => obj.id !== objetivoId);
        
        await actualizarPlanServicio(plan);
        
        console.log("✅ Objetivo eliminado");
    } catch (error) {
        console.error("❌ Error eliminando objetivo:", error);
        throw new Error(`Error al eliminar objetivo: ${error.message}`);
    }
}

// ==========================================
// ACTIVIDADES
// ==========================================

export async function agregarActividadServicio(planId, actividad) {
    try {
        console.log("✏️ Agregando actividad al plan:", planId);
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        if (!plan.actividades) {
            plan.actividades = [];
        }
        
        const actividadConId = {
            id: "act_" + Date.now(),
            ...actividad,
            completado: false,
            fechasCompletadas: [],
            createdAt: new Date().toISOString()
        };
        
        plan.actividades.push(actividadConId);
        
        await actualizarPlanServicio(plan);
        
        console.log("✅ Actividad agregada");
        
        return actividadConId;
    } catch (error) {
        console.error("❌ Error agregando actividad:", error);
        throw new Error(`Error al agregar actividad: ${error.message}`);
    }
}

export async function actualizarActividadServicio(planId, actividadId, datosActualizacion) {
    try {
        console.log("📝 Actualizando actividad:", actividadId);
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        const indiceActividad = plan.actividades.findIndex(act => act.id === actividadId);
        
        if (indiceActividad === -1) {
            throw new Error("Actividad no encontrada");
        }
        
        plan.actividades[indiceActividad] = {
            ...plan.actividades[indiceActividad],
            ...datosActualizacion,
            updatedAt: new Date().toISOString()
        };
        
        await actualizarPlanServicio(plan);
        
        console.log("✅ Actividad actualizada");
        
        return plan.actividades[indiceActividad];
    } catch (error) {
        console.error("❌ Error actualizando actividad:", error);
        throw new Error(`Error al actualizar actividad: ${error.message}`);
    }
}

export async function eliminarActividadServicio(planId, actividadId) {
    try {
        console.log("🗑️ Eliminando actividad:", actividadId);
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        plan.actividades = (plan.actividades || []).filter(act => act.id !== actividadId);
        
        await actualizarPlanServicio(plan);
        
        console.log("✅ Actividad eliminada");
    } catch (error) {
        console.error("❌ Error eliminando actividad:", error);
        throw new Error(`Error al eliminar actividad: ${error.message}`);
    }
}

export async function marcarActividadCompletadaServicio(planId, actividadId, completado = true) {
    try {
        console.log("✅ Marcando actividad:", actividadId, completado ? "completada" : "incompleta");
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        const actividad = plan.actividades.find(act => act.id === actividadId);
        
        if (!actividad) {
            throw new Error("Actividad no encontrada");
        }
        
        actividad.completado = completado;
        
        if (!actividad.fechasCompletadas) {
            actividad.fechasCompletadas = [];
        }
        
        if (completado) {
            actividad.fechasCompletadas.push(new Date().toISOString());
        }
        
        await actualizarPlanServicio(plan);
        
        console.log("✅ Estado de actividad actualizado");
        
        return actividad;
    } catch (error) {
        console.error("❌ Error marcando actividad:", error);
        throw new Error(`Error al marcar actividad: ${error.message}`);
    }
}

// ==========================================
// SEGUIMIENTO
// ==========================================

export async function agregarRegistroSeguimientoServicio(planId, nota) {
    try {
        console.log("📝 Agregando registro de seguimiento");
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        if (!plan.registroSeguimiento) {
            plan.registroSeguimiento = [];
        }
        
        const registro = {
            id: "reg_" + Date.now(),
            fecha: new Date().toISOString(),
            nota: nota,
            usuario: "Terapista" // TODO: Obtener usuario actual
        };
        
        plan.registroSeguimiento.push(registro);
        
        await actualizarPlanServicio(plan);
        
        console.log("✅ Registro agregado");
        
        return registro;
    } catch (error) {
        console.error("❌ Error agregando registro:", error);
        throw new Error(`Error al agregar registro: ${error.message}`);
    }
}

export async function obtenerRegistroSeguimientoServicio(planId) {
    try {
        console.log("📊 Obteniendo registro de seguimiento");
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        return plan.registroSeguimiento || [];
    } catch (error) {
        console.error("❌ Error obteniendo registro:", error);
        throw new Error(`Error al obtener registro: ${error.message}`);
    }
}

// ==========================================
// CÁLCULOS Y ESTADÍSTICAS
// ==========================================

export async function calcularProgresoServicio(planId) {
    try {
        console.log("📊 Calculando progreso del plan");
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        const actividades = plan.actividades || [];
        const totalActividades = actividades.length;
        
        if (totalActividades === 0) {
            return {
                porcentaje: 0,
                actividadesCompletadas: 0,
                totalActividades: 0,
                actividadesPendientes: 0
            };
        }
        
        const actividadesCompletadas = actividades.filter(act => act.completado).length;
        const actividadesPendientes = totalActividades - actividadesCompletadas;
        const porcentaje = Math.round((actividadesCompletadas / totalActividades) * 100);
        
        console.log(`✅ Progreso: ${porcentaje}% (${actividadesCompletadas}/${totalActividades})`);
        
        return {
            porcentaje,
            actividadesCompletadas,
            totalActividades,
            actividadesPendientes
        };
    } catch (error) {
        console.error("❌ Error calculando progreso:", error);
        throw new Error(`Error al calcular progreso: ${error.message}`);
    }
}

export async function obtenerEstadísticasServicio(planId) {
    try {
        console.log("📊 Obteniendo estadísticas del plan");
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        const actividades = plan.actividades || [];
        const objetivos = plan.objetivos || [];
        const registros = plan.registroSeguimiento || [];
        
        const actividadesCompletadas = actividades.filter(act => act.completado).length;
        const duracionTotal = actividades.reduce((sum, act) => sum + (act.duracion || 0), 0);
        const frecuencias = {};
        
        actividades.forEach(act => {
            frecuencias[act.frecuencia] = (frecuencias[act.frecuencia] || 0) + 1;
        });
        
        const estadisticas = {
            totalObjetivos: objetivos.length,
            totalActividades: actividades.length,
            actividadesCompletadas,
            actividadesPendientes: actividades.length - actividadesCompletadas,
            porcentajeCompleción: actividades.length > 0 
                ? Math.round((actividadesCompletadas / actividades.length) * 100)
                : 0,
            duracionTotal,
            duracionPromedio: actividades.length > 0 
                ? Math.round(duracionTotal / actividades.length)
                : 0,
            frecuencias,
            totalRegistros: registros.length,
            diasActivo: plan.fechaInicio && plan.fechaTermino
                ? Math.ceil((new Date(plan.fechaTermino) - new Date(plan.fechaInicio)) / (1000 * 60 * 60 * 24))
                : 0
        };
        
        console.log("✅ Estadísticas calculadas", estadisticas);
        
        return estadisticas;
    } catch (error) {
        console.error("❌ Error obteniendo estadísticas:", error);
        throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
}

// ==========================================
// BÚSQUEDA Y FILTRADO
// ==========================================

export async function buscarPlanesServicio(criterio) {
    try {
        console.log("🔍 Buscando planes:", criterio);
        
        const planes = await obtenerPlanesServicio();
        
        const resultados = planes.filter(plan => 
            plan.nombrePlan.toLowerCase().includes(criterio.toLowerCase()) ||
            plan.nombreEstudiante.toLowerCase().includes(criterio.toLowerCase()) ||
            plan.descripcion.toLowerCase().includes(criterio.toLowerCase())
        );
        
        console.log(`✅ Se encontraron ${resultados.length} planes`);
        
        return resultados;
    } catch (error) {
        console.error("❌ Error buscando planes:", error);
        throw new Error(`Error al buscar planes: ${error.message}`);
    }
}

export async function obtenerPlanesPorEstudiante(nombreEstudiante) {
    try {
        console.log("📋 Obteniendo planes del estudiante:", nombreEstudiante);
        
        const planes = await obtenerPlanesServicio();
        
        const planesPorEstudiante = planes.filter(plan =>
            plan.nombreEstudiante.toLowerCase() === nombreEstudiante.toLowerCase()
        );
        
        console.log(`✅ Se encontraron ${planesPorEstudiante.length} planes`);
        
        return planesPorEstudiante;
    } catch (error) {
        console.error("❌ Error obteniendo planes del estudiante:", error);
        throw new Error(`Error al obtener planes: ${error.message}`);
    }
}

// ==========================================
// EXPORTAR PLAN
// ==========================================

export async function exportarPlanJSONServicio(planId) {
    try {
        console.log("📤 Exportando plan como JSON");
        
        const plan = await obtenerPlanPorIdServicio(planId);
        
        const jsonString = JSON.stringify(plan, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = `plan_${plan.nombrePlan.replace(/\s+/g, "_")}_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log("✅ Plan exportado");
    } catch (error) {
        console.error("❌ Error exportando plan:", error);
        throw new Error(`Error al exportar plan: ${error.message}`);
    }
}

export async function importarPlanJSONServicio(jsonData) {
    try {
        console.log("📥 Importando plan desde JSON");
        
        const planData = typeof jsonData === "string" 
            ? JSON.parse(jsonData)
            : jsonData;
        
        // Validar datos mínimos
        if (!planData.nombrePlan || !planData.nombreEstudiante) {
            throw new Error("El plan debe tener nombrePlan y nombreEstudiante");
        }
        
        // Crear nuevo plan
        const nuevoPlan = await crearPlanServicio(planData);
        
        console.log("✅ Plan importado con ID:", nuevoPlan.id);
        
        return nuevoPlan;
    } catch (error) {
        console.error("❌ Error importando plan:", error);
        throw new Error(`Error al importar plan: ${error.message}`);
    }
}

// ==========================================
// DUPLICAR PLAN
// ==========================================

export async function duplicarPlanServicio(planId, nuevoNombre = null) {
    try {
        console.log("🔄 Duplicando plan:", planId);
        
        const planOriginal = await obtenerPlanPorIdServicio(planId);
        
        const planDuplicado = {
            ...planOriginal,
            nombrePlan: nuevoNombre || `${planOriginal.nombrePlan} (Copia)`,
            estado: "activo",
            fechaInicio: new Date().toISOString().split('T')[0],
            fechaTermino: "",
            registroSeguimiento: [],
            actividades: (planOriginal.actividades || []).map(act => ({
                ...act,
                id: "act_" + Date.now(),
                completado: false,
                fechasCompletadas: []
            }))
        };
        
        delete planDuplicado.id;
        delete planDuplicado.createdAt;
        delete planDuplicado.updatedAt;
        
        const nuevoPlan = await crearPlanServicio(planDuplicado);
        
        console.log("✅ Plan duplicado con ID:", nuevoPlan.id);
        
        return nuevoPlan;
    } catch (error) {
        console.error("❌ Error duplicando plan:", error);
        throw new Error(`Error al duplicar plan: ${error.message}`);
    }
}
