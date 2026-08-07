export default {
  name: 'ShareCodeModal',
  props: {
    shareCode: String,
    qrUrl: String,
    mode: { type: String, default: 'export' }
  },
  emits: ['close', 'copy', 'import-code'],
  data() {
    return { importText: '', importError: null };
  },
  methods: {
    copyCode() {
      this.$emit('copy');
    },
    submitImport() {
      this.importError = null;
      this.$emit('import-code', this.importText.trim());
    }
  },
  template: `
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal share-modal animate__animated animate__fadeIn">
        <h3>{{ mode === 'export' ? '📤 Share Save Code' : '📥 Import Share Code' }}</h3>

        <template v-if="mode === 'export'">
          <p class="section-text muted">Copy this code or scan the QR to transfer your save to another device.</p>
          <div class="share-code-box">{{ shareCode }}</div>
          <img v-if="qrUrl" :src="qrUrl" alt="Save QR code" class="share-qr" />
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="$emit('close')">Close</button>
            <button class="btn btn-primary" @click="copyCode">Copy Code</button>
          </div>
        </template>

        <template v-else>
          <p class="section-text muted">Paste a share code from another device.</p>
          <textarea v-model="importText" class="share-import-input" rows="4" placeholder="AFK1:..."></textarea>
          <p v-if="importError" class="section-text danger">{{ importError }}</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" @click="$emit('close')">Cancel</button>
            <button class="btn btn-primary" :disabled="!importText.trim()" @click="submitImport">Import</button>
          </div>
        </template>
      </div>
    </div>
  `
};
