/* /form/formulario.js
   White-label: você hospeda no site do cliente e só muda data-* no script.
*/
(function () {
  // =========================
  // Helpers
  // =========================
  function pickDataset() {
    // Melhor caso: o script atual
    const s = document.currentScript;
    if (s && s.dataset) return s.dataset;

    // Fallback: pega o último script com data-client-id
    const all = Array.from(document.querySelectorAll("script[data-client-id]"));
    const last = all[all.length - 1];
    return (last && last.dataset) || {};
  }

  function getUtm() {
    const p = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];
    const out = {};
    keys.forEach((k) => {
      const v = p.get(k);
      if (v) out[k] = v;
    });
    return out;
  }

  function normalizePhone(phone) {
    if (!phone) return "";
    return String(phone).replace(/\D+/g, "");
  }

  function isValidEmail(email) {
    if (!email) return false;
    const s = String(email).trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  }

  function normalizeUrl(input) {
    if (!input) return "";
    const raw = String(input).trim();
    if (!raw) return "";

    // Se vier sem http/https, não aceita (pra evitar redirect bugado)
    if (!/^https?:\/\//i.test(raw)) return "";
    return raw;
  }

  function log(debug, ...args) {
    if (debug) console.log("[LB FORM]", ...args);
  }
  function warn(debug, ...args) {
    if (debug) console.warn("[LB FORM]", ...args);
  }
  function errlog(debug, ...args) {
    if (debug) console.error("[LB FORM]", ...args);
  }

  async function safeJson(res) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }

  async function sendLead({ api, payload, debug }) {
    const res = await fetch(api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await safeJson(res);
    log(debug, "HTTP", res.status, data);

    // Edge pode retornar 200 ok:false (tratado) ou 201 ok:true
    if (!res.ok) {
      const msg = data?.message || data?.error || "Erro ao enviar lead";
      const hint = data?.hint ? ` (${data.hint})` : "";
      throw new Error(msg + hint);
    }

    if (data && data.ok === false) {
      const msg = data?.message || "Erro ao enviar lead";
      const hint = data?.hint ? ` (${data.hint})` : "";
      throw new Error(msg + hint);
    }

    return data;
  }

  function createToast() {
    const el = document.createElement("div");
    el.className = "lb-toast";
    el.style.cssText = [
      "position:fixed",
      "left:50%",
      "bottom:24px",
      "transform:translateX(-50%)",
      "z-index:999999",
      "max-width:min(560px,calc(100vw - 32px))",
      "padding:12px 14px",
      "border-radius:14px",
      "background:rgba(0,0,0,.85)",
      "color:#fff",
      "font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif",
      "font-size:14px",
      "line-height:1.35",
      "box-shadow:0 12px 30px rgba(0,0,0,.3)",
      "opacity:0",
      "pointer-events:none",
      "transition:opacity .2s ease, transform .2s ease",
    ].join(";");
    document.body.appendChild(el);

    let t = null;
    return {
      show(msg, type) {
        el.textContent = msg;
        if (type === "error") el.style.background = "rgba(176,0,3,.92)";
        if (type === "success") el.style.background = "rgba(0,0,0,.85)";
        el.style.opacity = "1";
        el.style.transform = "translateX(-50%) translateY(-6px)";
        clearTimeout(t);
        t = setTimeout(() => {
          el.style.opacity = "0";
          el.style.transform = "translateX(-50%)";
        }, 3200);
      },
    };
  }

  // =========================
  // Modal injection (se quiser usar o modal)
  // =========================
  function injectModalOnce() {
    if (document.querySelector(".form-modal")) return;

    const modalHTML = `
      <div class="form-modal white" aria-hidden="true">
        <div class="form-overlay" aria-hidden="true"></div>

        <div class="form-container" role="dialog" aria-modal="true" aria-label="Formulário">
          <div class="head">
            <h2>Preencha seus dados</h2>
            <span class="form-fechar" role="button" tabindex="0" aria-label="Fechar formulário">&times;</span>
          </div>

          <form id="formLead" autocomplete="on">
            <input type="text" name="nome" placeholder="Seu nome" required />
            <input type="email" name="email" placeholder="Seu e-mail" />
            <input type="tel" name="telefone" placeholder="Seu WhatsApp" />

            <div class="">
              <button class="appLocalLead" type="submit">Enviar</button>

            </div>
          </form>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  // =========================
  // Setup events
  // =========================
  function setup() {
    const ds = pickDataset();

    const clientId = ds.clientId || "";
    const embedKey = ds.embedKey || "";
    const api = ds.api || "";
    const debug = ds.debug === "true";

    // NOVO: redirect genérico
    const redirectUrl = normalizeUrl(ds.redirect || "");

    log(debug, "dataset:", {
      clientId,
      embedKey: embedKey ? "OK" : "",
      api,
      redirect: redirectUrl ? "OK" : "",
    });

    if (!clientId || !embedKey || !api) {
      warn(
        debug,
        "Faltando data-client-id / data-embed-key / data-api no <script> do formulário."
      );
    }

    if (ds.redirect && !redirectUrl) {
      warn(debug, "data-redirect foi informado mas é inválido (precisa começar com http/https).");
    }

    const toast = createToast();

    // Injeta modal se existir botão .abrir-formulario (pra não poluir LPs que não usem modal)
    const hasOpenBtn = document.querySelector(".abrir-formulario");
    if (hasOpenBtn) injectModalOnce();

    const modal = document.querySelector(".form-modal");
    const overlay = document.querySelector(".form-overlay");
    const closeBtn = document.querySelector(".form-fechar");
    const modalForm = document.querySelector("#formLead");

    function openModal() {
      if (!modal) return;
      modal.classList.add("visivel");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
    function closeModal() {
      if (!modal) return;
      modal.classList.remove("visivel");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    // Abre modal via botões
    document.querySelectorAll(".abrir-formulario").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
      });
    });

    // Fecha modal
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
      closeBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") closeModal();
      });
    }
    if (overlay) overlay.addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && modal.classList.contains("visivel")) closeModal();
    });

    function setSubmitting(formEl, value) {
      const btns = Array.from(formEl.querySelectorAll("button[type='submit']"));
      btns.forEach((b) => (b.disabled = value));
    }

    async function handleSubmit(formEl, mapFields) {
      setSubmitting(formEl, true);

      try {
        const raw = mapFields(formEl);
        const name = String(raw.name || "").trim();
        const email = String(raw.email || "").trim();
        const phone = normalizePhone(raw.phone || "");

        if (!name) {
          toast.show("Informe seu nome.", "error");
          return;
        }
        if (email && !isValidEmail(email)) {
          toast.show("Digite um e-mail válido.", "error");
          return;
        }
        if (!email && !phone) {
          toast.show("Informe e-mail ou WhatsApp.", "error");
          return;
        }

        if (!clientId || !embedKey || !api) {
          toast.show("Formulário não configurado (dados do script faltando).", "error");
          errlog(debug, "Missing config:", { clientId, embedKey, api });
          return;
        }

        const payload = {
          clientId,
          embedKey,
          name,
          email: email || undefined,
          phone: phone || undefined,
          pageUrl: window.location.href,
          utm: getUtm(),
        };

        log(debug, "payload:", payload);

        await sendLead({ api, payload, debug });

        toast.show("Enviado com sucesso! ✅", "success");
        formEl.reset();

        // Redireciona para URL genérica (se configurada)
        if (redirectUrl) {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 450);
          return;
        }

        // Se for modal e não tiver redirect, fecha
        if (formEl === modalForm) closeModal();
      } catch (e) {
        errlog(debug, e);
        toast.show(e?.message || "Erro ao enviar. Tente novamente.", "error");
      } finally {
        setSubmitting(formEl, false);
      }
    }

    // Modal form (se existir)
    if (modalForm) {
      modalForm.addEventListener("submit", (e) => {
        e.preventDefault();
        handleSubmit(modalForm, (f) => ({
          name: f.querySelector('[name="nome"]')?.value,
          email: f.querySelector('[name="email"]')?.value,
          phone: f.querySelector('[name="telefone"]')?.value,
        }));
      });
    }

    // Forms inline (se existir)
    document.querySelectorAll("form.lb-lead-form").forEach((f) => {
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        handleSubmit(f, (formEl) => ({
          name: formEl.querySelector('[name="name"]')?.value,
          email: formEl.querySelector('[name="email"]')?.value,
          phone: formEl.querySelector('[name="phone"]')?.value,
        }));
      });
    });

    // Se não existir modal nem form inline, avisa no debug
    if (debug) {
      const hasInline = document.querySelector("form.lb-lead-form");
      const hasModalForm = document.querySelector("#formLead");
      if (!hasInline && !hasModalForm) {
        warn(
          debug,
          "Nenhum form encontrado. Use botões .abrir-formulario (modal) ou um <form class='lb-lead-form'> (inline)."
        );
      }
    }

    log(debug, "setup ok");
  }

  function init() {
    setup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
