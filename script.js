'use strict';
const WHATSAPP_NUMBER = '50688630845';
const menu = document.querySelector('#main-nav');
const menuToggle = document.querySelector('#menu-toggle');
const dateInput = document.querySelector('input[name="fecha"]');
const quoteForm = document.querySelector('#quote-form');
const serviceSelect = document.querySelector('#servicio');
const toast = document.querySelector('#toast');
let toastTimer;
function announce(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}
menuToggle?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
});
menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  menu.classList.remove('open');
  document.body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.classList.contains('open')) menuToggle?.click();
});
window.addEventListener('scroll', () => document.querySelector('.header')?.classList.toggle('is-scrolled', window.scrollY > 15), {passive:true});

// Carrusel: control por botones, puntos, teclado, deslizamiento y reproducción automática.
const slider = document.getElementById('hero-slider');
const slides = [...document.querySelectorAll('.hero-slider .slide')];
const dots = [...document.querySelectorAll('.slider-dots .dot')];
const counter = document.querySelector('.slide-count');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let current = 0;
let slideTimer = null;
let touchX = null;
function showSlide(index) {
  if (!slides.length) return;
  current = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => {
    const selected = i === current;
    slide.classList.toggle('active', selected);
    slide.setAttribute('aria-hidden', String(!selected));
  });
  dots.forEach((dot, i) => {
    const selected = i === current;
    dot.classList.toggle('active', selected);
    dot.setAttribute('aria-current', String(selected));
  });
  if (counter) counter.textContent = `${String(current + 1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
}
function pauseSlides() { clearInterval(slideTimer); slideTimer = null; }
function startSlides() {
  pauseSlides();
  if (!reduceMotion && !document.hidden && slides.length > 1) slideTimer = setInterval(() => showSlide(current + 1), 5500);
}
function moveSlide(direction) { showSlide(current + direction); startSlides(); }
document.querySelector('.slider-prev')?.addEventListener('click', () => moveSlide(-1));
document.querySelector('.slider-next')?.addEventListener('click', () => moveSlide(1));
dots.forEach((dot, i) => dot.addEventListener('click', () => { showSlide(i); startSlides(); }));
slider?.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {event.preventDefault();moveSlide(event.key === 'ArrowRight'?1:-1);}
});
slider?.addEventListener('touchstart', event => { touchX = event.touches[0]?.clientX ?? null; }, {passive:true});
slider?.addEventListener('touchend', event => {
  if (touchX === null) return;
  const delta = event.changedTouches[0].clientX - touchX;
  if (Math.abs(delta) > 45) moveSlide(delta < 0 ? 1 : -1);
  touchX = null;
}, {passive:true});
slider?.addEventListener('mouseenter', pauseSlides);
slider?.addEventListener('mouseleave', startSlides);
slider?.addEventListener('focusin', pauseSlides);
slider?.addEventListener('focusout', event => {if (!slider.contains(event.relatedTarget)) startSlides();});
document.addEventListener('visibilitychange', () => document.hidden ? pauseSlides() : startSlides());
showSlide(0);startSlides();

// Filtro de snacks.
document.querySelectorAll('.snack-tab').forEach(button => button.addEventListener('click', () => {
  const category = button.dataset.filter;
  document.querySelectorAll('.snack-tab').forEach(b => {
    const active = b === button;
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-pressed', String(active));
  });
  document.querySelectorAll('.snack-card').forEach(card => card.classList.toggle('is-hidden', category !== 'todos' && card.dataset.category !== category));
}));

// Elegir opciones para cotizar.
document.querySelectorAll('[data-service]').forEach(btn => btn.addEventListener('click', () => {
  if (serviceSelect) serviceSelect.value = btn.dataset.service;
  document.querySelector('#cotizar')?.scrollIntoView({behavior:reduceMotion?'auto':'smooth'});
  announce(`${btn.dataset.service} agregado a tu consulta`);
}));
document.querySelectorAll('[data-add-snack]').forEach(btn => btn.addEventListener('click', () => {
  const snack = btn.dataset.addSnack;
  const checkbox = [...document.querySelectorAll('input[name="snacks"]')].find(c => c.value === snack);
  if (!checkbox) return;
  checkbox.checked = !checkbox.checked;
  btn.classList.toggle('is-added', checkbox.checked);
  btn.textContent = checkbox.checked ? '✓' : '＋';
  btn.setAttribute('aria-label', `${checkbox.checked?'Quitar':'Agregar'} ${snack} ${checkbox.checked?'de':'a'} la cotización`);
  announce(checkbox.checked ? `${snack} agregado a tu consulta` : `${snack} quitado de tu consulta`);
  if (checkbox.checked && serviceSelect && !serviceSelect.value) serviceSelect.value = 'Snacks para fiestas';
}));
document.querySelectorAll('input[name="snacks"]').forEach(box => box.addEventListener('change', () => {
  const btn = [...document.querySelectorAll('[data-add-snack]')].find(b => b.dataset.addSnack === box.value);
  if (btn) {btn.classList.toggle('is-added',box.checked);btn.textContent=box.checked?'✓':'＋';}
}));

// Configuración por zona horaria local, sin bloquear reservas del mismo día.
if (dateInput) {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  dateInput.min = today.toISOString().slice(0,10);
}
const year = document.getElementById('year');if(year)year.textContent=new Date().getFullYear();

quoteForm?.addEventListener('submit', event => {
  event.preventDefault();
  if (!quoteForm.reportValidity()) return;
  const data = new FormData(quoteForm);
  const date = String(data.get('fecha') || '');
  const dateText = date ? new Date(`${date}T12:00:00`).toLocaleDateString('es-CR',{day:'numeric',month:'long',year:'numeric'}) : 'Por definir';
  const snacks = data.getAll('snacks');
  const lines = [
    '¡Hola, Bodolandia! Quiero consultar una cotización para un evento 🎉',
    '',
    `👤 Nombre: ${data.get('nombre')}`,
    `📅 Fecha: ${dateText}`,
    `📍 Lugar: ${data.get('zona')}`,
    `🎈 Servicio: ${data.get('servicio')}`,
    `🍿 Snacks: ${snacks.length ? snacks.join(', ') : 'Por definir'}`,
    `📝 Detalles: ${String(data.get('detalles') || '').trim() || 'Sin detalles adicionales'}`,
    '',
    '¿Me podrían indicar disponibilidad, precios y condiciones? ¡Gracias!'
  ];
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
  const feedback = document.getElementById('form-message');
  // Navegamos al enlace de WhatsApp sin intentar enviar el mensaje automáticamente.
  if (feedback) feedback.textContent = 'Se abrirá WhatsApp con tu solicitud lista para revisar y enviar.';
  window.location.href = url;
});

// Efectos de aparición respetando accesibilidad y reducción de movimiento.
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {entry.target.classList.add('visible');observer.unobserve(entry.target);}
    });
  },{threshold:.08,rootMargin:'0px 0px 50px 0px'});
  document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
} else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));
