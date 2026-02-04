<script setup lang="ts">
import UsageChart from './UsageChart.vue';
import TopDocsChart from './TopDocsChart.vue';
import TopicChart from './TopicChart.vue';
import SourceChart from './SourceChart.vue';
</script>

<template>
    <div class="space-y-4 overflow-y-auto pr-2">
        <UsageChart />
        <TopDocsChart />
        <TopicChart />
        <SourceChart />
    </div>
</template>
