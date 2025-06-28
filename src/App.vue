<script setup>
import { initializeSession } from '@/store/session';
import { onMounted } from 'vue';

onMounted(() => {
    initializeSession();
});
</script>

<template>
    <router-view />
</template>

<style scoped></style>
