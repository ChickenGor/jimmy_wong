const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
        siteNav.classList.toggle('open');
        navToggle.classList.toggle('active');
    });

    document.querySelectorAll('.site-nav a').forEach((link) => {
        link.addEventListener('click', () => {
            siteNav.classList.remove('open');
            navToggle.classList.remove('active');
        });
    });
}
