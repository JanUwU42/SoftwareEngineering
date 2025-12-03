<script>
  let email = '';
  let message = '';

  const handleSubmit = async () => {
    if (!email.includes('@')) {
      message = 'Please enter a valid email';
      return;
    }

    message = 'Reset link sent to ' + email;
    email = '';
  };
</script>

<div class="reset-form">
  <h2>Reset Password</h2>

  <form on:submit|preventDefault={handleSubmit}>
    <input
      type="email"
      bind:value={email}
      placeholder="Enter your email"
    />

    <button type="submit">Send Reset Link</button>
  </form>

  {#if message}
    <p>{message}</p>
  {/if}
</div>
