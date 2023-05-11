<script setup>
import { reactive, onMounted } from 'vue';

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
  const request = fetch(url, fetchOptions);
  event.preventDefault();
  return request;
}

const data = reactive({
  isLoading: undefined,
});

onMounted(() => {
  const form = document.querySelector('form');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    data.isLoading = true;
    await handleSubmit(event);
    data.isLoading = false;
  });
});
</script>

<template>
  <main>
    <h1>Upload a file</h1>
    <form action="/api" method="post" enctype="multipart/form-data">
      <label for="file">File</label>
      <input id="file" name="file1" type="file" accept="image/*, text/plain" multiple />
      <br /><br />
      <button>{{ data.isLoading ? 'Uploading' : 'Upload' }}</button>
    </form>

    <!-- <img
      v-if="data.isLoading != null && !data.isLoading"
      src="https://austins-bucket.us-southeast-1.linodeobjects.com/files/nugget.jpg"
      alt="My dog, Nugget making a really big yawn."
    /> -->
    <!-- <img src="https://uploader.austingil.com/files/nugget.jpg" alt="" /> -->
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
