<script>
export default {
    data() {
        return {
            email: "",
            message: "",
        };
    },
    methods: {
        handleSubmit() {
            if (!this.email.includes("@")) {
                this.message = "Please enter a valid email";
                return;
            }

            this.message = "Reset link sent to " + this.email;
            this.email = "";
        },
    },
};
</script>

<template>
    <div class="reset-form">
        <h2>Reset Password</h2>

        <form @submit.prevent="handleSubmit">
            <input
                type="email"
                v-model="email"
                placeholder="Enter your email"
            />

            <button type="submit">Send Reset Link</button>
        </form>

        <p v-if="message">{{ message }}</p>
    </div>
</template>
