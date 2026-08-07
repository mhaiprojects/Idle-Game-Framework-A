export const SynergySystem = {
  isEnabled(config) {
    return (config.synergies?.synergies?.length || 0) > 0;
  },

  isActive(synergy, state) {
    const minQty = synergy.minQuantity ?? 1;
    return (synergy.generators || []).every(code =>
      (state.generators[code]?.quantityPurchased || 0) >= minQty
    );
  },

  getActiveSynergies(state, config) {
    if (!this.isEnabled(config)) return [];
    return (config.synergies.synergies || []).filter(s => this.isActive(s, state));
  },

  getDisplay(state, config) {
    return (config.synergies?.synergies || []).map(s => ({
      ...s,
      active: this.isActive(s, state)
    }));
  }
};
