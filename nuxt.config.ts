// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        // class: 'no-js',
      },
      script: [
        // {
        //   innerHTML: `
        //     document.documentElement.classList.remove('no-js');
        //     document.documentElement.classList.add('js');
        //   `,
        // },
      ],
    },
  },
  css: ['@fontsource/manrope', '@/assets/main.css'],
});
