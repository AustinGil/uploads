<script setup>
import { onMounted } from 'vue';

/** @param {Event} event */
function handleSubmit(event) {
  /** @type {HTMLFormElement} */
  const form = event.currentTarget;
  const url = new URL(form.action);
  const formData = new FormData(form);
  const searchParams = new URLSearchParams(formData);
  /** @type {Parameters<fetch>[1]} */
  const fetchOptions = {
    method: form.method,
  };

  if (form.method.toLowerCase() === 'post') {
    fetchOptions.body =
      form.enctype === 'multipart/form-data' ? formData : searchParams;
  } else {
    url.search = searchParams;
  }
  fetch(url, fetchOptions);
  event.preventDefault();
}

onMounted(() => {
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', handleSubmit);

  /** @type {NodeListOf<HTMLInputElement>} */
  const inputs = document.querySelectorAll('input[type="file"]');
  for (const input of inputs) {
    const file = new File([`content for ${input.name}`], `${input.name}.txt`);
    const container = new DataTransfer();
    container.items.add(file);
    input.files = container.files;
  }
});
</script>

<template>
  <main>
    <h1>Upload a file</h1>
    <form action="/api" method="post" enctype="multipart/form-data">
      <label for="file">File</label>
      <input id="file" name="file1" type="file" />
      <br /><br />
      <button>Upload</button>
    </form>
  </main>
</template>

<style>
* {
  box-sizing: border-box;
}

main {
  max-inline-size: 48rem;
  margin-inline: auto;
  border: 0.125rem solid;
  padding: 0.75rem;
  background: #fff;
}

h1 {
  margin-block-start: 0;
}

input {
  inline-size: 100%;
  border: 0.125rem solid;
  border-radius: 0.25rem;
  line-height: 1;
  padding: 0.25rem;
}

img {
  display: block;
  margin: 1rem auto 0;
}
</style>
