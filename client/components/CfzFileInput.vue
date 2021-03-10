<template>
    <input type="file" ref="fileInput"
        accept=".puz,.eno,.confuz,.🧩✨"
        @change="handleFiles()"
        style="display: none">
    </input>
</template>
<script>
import Vue from "vue";
export default Vue.extend({
    methods: {
        openFile() {
            this.$refs.fileInput.click();
        },
        handleFiles() {
            const self = this;
            let files = this.$refs.fileInput.files;
            const file = files[0];
            if (file.name.endsWith('.eno') || file.name.endsWith('.confuz')) {
                file.arrayBuffer().then(
                    buffer => self.$emit('eno-file-uploaded', buffer)
                )
            } else if (file.name.endsWith('.🧩')) {
                file.arrayBuffer().then(
                    buffer => self.$emit('emoji-file-uploaded', buffer)
                )
            } else {
                file.arrayBuffer().then(
                    buffer => self.$emit('puz-file-uploaded', buffer)
                )
            }
            self.$emit('file-uploaded');
        }
    }
})
</script>
