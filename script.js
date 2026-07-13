(function () {
  "use strict";

  var EVALUACIONES = [
    { id: "parcial1", nombre: "Primer parcial",                 corto: "Parcial 1", peso: 35, taller: false, parcial: true },
    { id: "parcial2", nombre: "Segundo parcial",                corto: "Parcial 2", peso: 35, taller: false, parcial: true },
    { id: "taller1",  nombre: "Primera evaluación de talleres", corto: "Taller 1",  peso: 8,  taller: true,  parcial: false },
    { id: "taller2",  nombre: "Segunda evaluación de talleres", corto: "Taller 2",  peso: 8,  taller: true,  parcial: false },
    { id: "taller3",  nombre: "Tercera evaluación de talleres", corto: "Taller 3",  peso: 8,  taller: true,  parcial: false },
    { id: "seminario", nombre: "Tarea interdisciplinaria",      corto: "Interdisc.", peso: 6, taller: false, parcial: false }
  ];

  var MAX_FALTAS = 8;

  var $ = function (id) { return document.getElementById(id); };

  function celdaNombre(ev) {
    return '<span class="nombre-largo">' + ev.nombre + '</span>' +
           '<span class="nombre-corto">' + ev.corto + '</span>';
  }

  // ---- construir tabla de pesos ----
  var tbodyPesos = $("tablaPesos");
  EVALUACIONES.forEach(function (ev) {
    var tr = document.createElement("tr");
    tr.innerHTML =
      "<td>" + celdaNombre(ev) + "</td>" +
      '<td><input type="number" min="0" max="100" step="0.5" id="peso-' + ev.id + '" value="' + ev.peso + '"> %</td>';
    tbodyPesos.appendChild(tr);
  });

  // ---- construir tabla de resultados ----
  var tbodyRes = $("tablaResultados");
  EVALUACIONES.forEach(function (ev) {
    var tr = document.createElement("tr");
    tr.id = "fila-" + ev.id;
    tr.innerHTML =
      "<td>" + celdaNombre(ev) + "</td>" +
      "<td>" +
        '<select id="modo-' + ev.id + '">' +
          '<option value="pct">%</option>' +
          '<option value="pts">Puntos</option>' +
        "</select>" +
      "</td>" +
      "<td>" +
        '<span id="entrada-pct-' + ev.id + '">' +
          '<input type="number" min="0" max="100" step="0.1" id="pct-' + ev.id + '" placeholder="0"> %' +
        "</span>" +
        '<span class="puntos-wrap oculto" id="entrada-pts-' + ev.id + '">' +
          '<input type="number" min="0" step="1" id="pts-x-' + ev.id + '" placeholder="0">' +
          '<span class="de">de</span>' +
          '<input type="number" min="1" step="1" id="pts-y-' + ev.id + '" placeholder="0">' +
        "</span>" +
      "</td>";
    tbodyRes.appendChild(tr);
  });

  // ---- helpers ----
  function num(input) {
    var v = parseFloat(input.value);
    return isNaN(v) ? 0 : v;
  }

  function talleresInhabilitados() {
    return $("noAsiste").checked || num($("faltas")) > MAX_FALTAS;
  }

  // % de aciertos de una evaluación (0–100)
  function porcentajeDe(ev) {
    if (ev.taller && talleresInhabilitados()) return 0;
    var modo = $("modo-" + ev.id).value;
    if (modo === "pct") {
      return Math.min(100, Math.max(0, num($("pct-" + ev.id))));
    }
    var x = num($("pts-x-" + ev.id));
    var y = num($("pts-y-" + ev.id));
    if (y <= 0) return 0;
    return Math.min(100, Math.max(0, (x / y) * 100));
  }

  function actualizarModo(ev) {
    var modo = $("modo-" + ev.id).value;
    $("entrada-pct-" + ev.id).classList.toggle("oculto", modo !== "pct");
    $("entrada-pts-" + ev.id).classList.toggle("oculto", modo !== "pts");
  }

  function actualizarHabilitacion() {
    var off = talleresInhabilitados();
    EVALUACIONES.forEach(function (ev) {
      if (!ev.taller) return;
      $("modo-" + ev.id).disabled = off;
      $("pct-" + ev.id).disabled = off;
      $("pts-x-" + ev.id).disabled = off;
      $("pts-y-" + ev.id).disabled = off;
      $("fila-" + ev.id).style.opacity = off ? "0.5" : "1";
    });
    var aviso = $("avisoTalleres");
    if (off) {
      aviso.textContent = $("noAsiste").checked
        ? "Al no asistir a clases, las evaluaciones de talleres no otorgan puntaje (cuentan como 0)."
        : "Con más de " + MAX_FALTAS + " faltas superás el 20% de inasistencias permitido: las evaluaciones de talleres no otorgan puntaje (cuentan como 0).";
      aviso.classList.add("visible");
    } else {
      aviso.classList.remove("visible");
    }
    $("faltas").disabled = $("noAsiste").checked;
  }

  function calcular() {
    actualizarHabilitacion();

    // suma de pesos
    var sumaPesos = 0;
    EVALUACIONES.forEach(function (ev) {
      sumaPesos += num($("peso-" + ev.id));
    });
    var sp = $("sumaPesos");
    sp.textContent = "Suma de pesos: " + sumaPesos.toFixed(1) + "%";
    sp.classList.toggle("error", Math.abs(sumaPesos - 100) > 0.01);
    if (Math.abs(sumaPesos - 100) > 0.01) {
      sp.textContent += " — debería sumar 100%";
    }

    // nota global
    var global = 0;
    var parcialesOk = true;
    EVALUACIONES.forEach(function (ev) {
      var pct = porcentajeDe(ev);
      var peso = num($("peso-" + ev.id));
      global += pct * (peso / 100);
      if (ev.parcial && pct < 40) parcialesOk = false;
    });

    $("notaGlobal").textContent = global.toFixed(1);

    var veredicto = $("veredicto");
    var detalle = $("detalleVeredicto");
    veredicto.classList.remove("exonera", "examen", "recursa");

    if (global >= 60 && parcialesOk) {
      veredicto.textContent = "EXONERA";
      veredicto.classList.add("exonera");
      detalle.textContent = "Nota global ≥ 60% y ambos parciales con al menos 40% de aciertos.";
    } else if (global >= 40) {
      veredicto.textContent = "RINDE EXAMEN";
      veredicto.classList.add("examen");
      detalle.textContent = global >= 60
        ? "La nota global alcanza, pero al menos un parcial tiene menos de 40% de aciertos."
        : "Nota global entre 40% y 59%.";
    } else {
      veredicto.textContent = "DEBE RECURSAR";
      veredicto.classList.add("recursa");
      detalle.textContent = "Nota global por debajo del 40%.";
    }
  }

  // ---- eventos ----
  EVALUACIONES.forEach(function (ev) {
    $("modo-" + ev.id).addEventListener("change", function () {
      actualizarModo(ev);
      calcular();
    });
    ["peso-", "pct-", "pts-x-", "pts-y-"].forEach(function (prefijo) {
      $(prefijo + ev.id).addEventListener("input", calcular);
    });
  });
  $("faltas").addEventListener("input", calcular);
  $("noAsiste").addEventListener("change", calcular);

  calcular();
})();
