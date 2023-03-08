/**
 * @typedef {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} HTMLFormControl
 */

const FORM_CONTROLS = 'input,select,textarea';

/** @param {HTMLFormControl} input */
function validateInput(input) {
  /**
   * 1. Check validity state
   * 2. Toggle aria-invalid
   * 3. Get or generate input ID
   * 4. Create .control__errors div with errors
   * 5. Connect with aria-describedby
   * 6. Account for pre-existing aria-describedby excluding
   * Challenge: Custom error messages via config
   * Challenge: Custom error messages via data-attrs
   */
  // 3. Get or generate input ID
  const inputId = input.id || Math.random().toString(36).slice(2);
  input.id = inputId;
  const errorsId = `${inputId}-input-errors`;
  // 6. Account for pre-existing aria-describedby excluding
  let descriptors = input.getAttribute('aria-describedby');
  descriptors = descriptors ? descriptors.split(' ') : [];
  descriptors = descriptors.filter((s) => s !== errorsId);

  const { validity } = input;
  // 2. Toggle aria-invalid
  input.setAttribute('aria-invalid', 'false');
  // 4. Create .control__errors div with errors
  document.getElementById(errorsId)?.remove();

  // 1. Check validity state
  if (!validity.valid) {
    // 2. Toggle aria-invalid
    input.setAttribute('aria-invalid', 'true');
    const errors = [];
    // 4. Create .control__errors div with errors
    const errorContainer = document.createElement('div');
    errorContainer.id = errorsId;
    errorContainer.classList.add('control__errors');
    // 4. Create .control__errors div with errors
    if (validity.valueMissing) {
      errors.push(`Field is required.`);
    }
    if (validity.typeMismatch) {
      errors.push(`Must be of type ${input.getAttribute('type')}.`);
    }
    if (validity.rangeUnderflow) {
      errors.push(`Must be greater than ${input.getAttribute('min')}.`);
    }
    if (validity.rangeOverflow) {
      errors.push(`Must be less than ${input.getAttribute('max')}.`);
    }
    if (validity.tooShort) {
      errors.push(`Must be longer than ${input.getAttribute('min-length')}.`);
    }
    if (validity.tooLong) {
      errors.push(`Must be shorter than ${input.getAttribute('max-length')}.`);
    }
    if (validity.patternMismatch) {
      errors.push(`Does not match pattern (${input.getAttribute('pattern')}).`);
    }
    // 4. Create .control__errors div with errors
    errorContainer.innerText = errors.join(' ');
    // 5. Connect with aria-describedby
    descriptors.push(errorsId);
    // 4. Create .control__errors div with errors
    input.parentElement.before(errorContainer);
  }
  if (descriptors.length > 0) {
    // 5. Connect with aria-describedby
    input.setAttribute('aria-describedby', descriptors.join(' '));
  }
}

/** @param {Event} event */
function validateOnEvent(event) {
  /** @type {HTMLFormControl} */
  // @ts-ignore
  const input = event.currentTarget;
  if (event.type === 'blur') {
    input.dataset.validateme = 'true';
  }
  if (!input.dataset.validateme) return;
  validateInput(input);
}
/** @param {HTMLFormControl} input */
export function enhanceInput(input) {
  input.addEventListener('input', validateOnEvent);
  input.addEventListener('blur', validateOnEvent);
}

class FetchError extends Error {
  /**
   * @param {ConstructorParameters<ErrorConstructor>[0]} message
   * @param {ConstructorParameters<ErrorConstructor>[1]} [options]
   */
  constructor(message, options) {
    super(message, options);
    this.name = 'FetchError';
  }
}

class LazyPromise extends Promise {
  /** @param {ConstructorParameters<PromiseConstructor>[0]} fn */
  constructor(fn) {
    super(fn);
    if (typeof fn !== 'function') {
      throw new TypeError(`Promise resolver is not a function`);
    }
    this._fn = fn;
  }
  then() {
    this.promise = this.promise || new Promise(this._fn);
    return this.promise.then.apply(this.promise, arguments);
  }
}
/**
 * @param {Parameters<typeof fetch>[0]} url
 * @param {Parameters<typeof fetch>[1] & {
 * data?: string | object,
 * json?: string | object,
 * timeout?: number
 * retry?: number
 * retryWait?: number
 * retryExponential?: boolean,
 * modifyRequest?: (init: Parameters<typeof enhancedFetch>[1]) => Parameters<typeof enhancedFetch>[1]
 * modifyResponse?: (response: ReturnType<enhancedFetch>) => any
 * }} [init={}]
 */
export function enhancedFetch(url, init = {}) {
  /**
   * 1. Put data on response object
   * 2. Errors on bad requests
   * 3. Retries
   * 4. Timeout
   * 5. Abortable
   * 6. Lazy execution
   * Challenge: How to handle 3XX status codes?
   * Challenge: Resumable on network reconnect (navigator.onLine)
   */

  url = new URL(url);
  // 5. Abortable
  const controller = new AbortController();
  if (!init.signal) {
    init.signal = controller.signal;
  }
  init.headers = init.headers || {};

  // Create custom return Promise with custom properties
  /** @type {Promise<Response & { data: any }> & { abort: typeof controller.abort }} */
  // 6. Lazy execution
  const promise = new LazyPromise(async (resolve, reject) => {
    try {
      // 4. Timeout
      if (init.timeout != null) {
        setTimeout(() => {
          reject(new FetchError('HTTP request exceeded timeout limit.'));
        }, init.timeout);
      }

      if (init.modifyRequest) {
        init = init.modifyRequest(init);
      }

      let response = await fetch(url, init);
      // 2. Errors on bad requests
      if (!response.ok) {
        // 3. Retries
        const retry = init.retry;
        if (retry) {
          init.retryWait = init.retryWait || 500;
          await new Promise((r) => setTimeout(r, init.retryWait));

          const exponential =
            init.retryExponential != undefined ? init.retryExponential : true;
          init.retryWait = exponential ? init.retryWait * 2 : init.retryWait;
          return resolve(
            enhancedFetch(url, {
              ...init,
              retry: retry - 1,
            })
          );
        } else {
          // 2. Errors on bad requests
          throw new FetchError(`${response.status} ${response.statusText}`, {
            cause: response,
          });
        }
      }

      // 1. Put data on response object
      let bodyType = 'text';
      if (response.headers.get('content-type')?.includes('application/json')) {
        bodyType = 'json';
      }

      // 1. Put data on response object
      const data = await response[bodyType]();
      response.data = data;

      if (init.modifyResponse) {
        response = init.modifyResponse(response);
      }

      resolve(response);
    } catch (error) {
      // 5. Abortable
      if (error.name !== 'AbortError') {
        // 2. Errors on bad requests
        reject(error);
      }
    }
  });

  // 5. Abortable
  promise.abort = () => controller.abort();
  return promise;
}

/**
 * @param {BeforeUnloadEvent} event
 */
function onBeforeUnload(event) {
  const changedForm = document.querySelector(
    'form[data-preventnav][data-haschanges'
  );
  if (!changedForm) return;
  event.preventDefault();
  // Chrome requires returnValue to be set.
  event.returnValue = '';
}

/**
 * @param {HTMLFormElement} form
 * @param {{
 * preventNav?: boolean
 * }} [options]
 */
export function enhanceForm(form, options = {}) {
  /**
   * 1. Enhance submission with fetch
   * 2. Account for file inputs (multipart/form-data)
   * 3. noValidate, checkValidity & reportValidity
   * 4. Custom input validation UI
   * 5. Focus/scroll management (w/o aria live regions)
   * 6. Validate inputs on input/blur
   * 7. Prevent page navigation
   * 8. Enhanced fetch
   * 9. Prevent spamming submit button
   * Challenge: Store in sessionStorage
   */

  // 7. Prevent page navigation
  if (options.preventNav) {
    form.dataset.preventnav = 'true';
    form.addEventListener('change', () => {
      form.dataset.haschanges = 'true';
    });
    form.addEventListener('submit', () => {
      form.dataset.haschanges = 'false';
    });
    window.addEventListener('beforeunload', onBeforeUnload);
  }

  // 4. Custom input validation UI
  /** @type {NodeListOf<HTMLFormControl>} */
  const inputs = form.querySelectorAll(FORM_CONTROLS);
  for (const input of inputs) {
    // 6. Validate inputs on input/blur
    enhanceInput(input);
  }

  // 3. noValidate, checkValidity & reportValidity
  form.noValidate = true;
  form.addEventListener('submit', (event) => {
    // 3. noValidate, checkValidity & reportValidity
    if (!form.checkValidity()) {
      // 4. Custom input validation UI
      for (const input of inputs) {
        input.dataset.validateme = 'true';
        validateInput(input);
      }
      // 5. Focus/scroll management (w/o aria live regions)
      form.querySelector(':invalid:not(fieldset)')?.focus();

      event.preventDefault();
      return;
    }
    // 9. Prevent spamming submit button
    if (form._pendingRequest) {
      form._pendingRequest?.abort && form._pendingRequest.abort();
    }

    // 1. Enhance submission with fetch
    const url = new URL(form.action || window.location.href);
    const formData = new FormData(form);
    const searchParameters = new URLSearchParams(formData);
    /** @type {Parameters<enhancedFetch>[1]} */
    const fetchOptions = {
      method: form.method,
    };

    // 1. Enhance submission with fetch
    if (fetchOptions.method.toUpperCase() === 'POST') {
      // 2. Account for file inputs (multipart/form-data)
      fetchOptions.body =
        form.enctype === 'multipart/form-data' ? formData : searchParameters;
    } else {
      url.search = searchParameters;
    }
    // 1. Enhance submission with fetch
    // 8. Enhanced fetch
    const request = enhancedFetch(url, fetchOptions);
    // 9. Prevent spamming submit button
    form._pendingRequest = request;
    request.then(() => {
      // 9. Prevent spamming submit button
      delete form._pendingRequest;
    });
    // 1. Enhance submission with fetch
    event.preventDefault();
    return request;
  });
}
