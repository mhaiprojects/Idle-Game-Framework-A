#!/usr/bin/env python3
"""Generate Dr Dirt content pack — Stone Age through AI Age."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'content' / 'dr-dirt'

GENERATOR_TIERS = {
    0: ['rockGatherer', 'woodcutter', 'campfire'],
    1: ['copperMine', 'bronzeSmelter', 'bronzeForge'],
    2: ['ironMine', 'blacksmith', 'tradeCaravan'],
    3: ['coalMine', 'steelMill', 'powerPlant'],
    4: ['dataCenter', 'mlLaboratory', 'agiCore'],
}


def write(name, data):
    (OUT / name).write_text(json.dumps(data, indent=2) + '\n')


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    write('manifest.json', {
        'id': 'dr-dirt',
        'displayName': 'Dr Dirt',
        'description': 'Guide civilization from the Stone Age to the AI Age. Each ascension advances humanity through history.',
        'icon': '🌍',
        'tagline': 'Stone Age → AI Age',
        'storageKey': 'afk_dr_dirt_save',
        'exportPrefix': 'dr-dirt',
        'themeColor': '#84cc16'
    })

    write('framework.json', {
        'gameLoop': {'tickRate': 10, 'maxDeltaCapSeconds': 1, 'targetFps': 60},
        'save': {
            'storageKey': 'afk_dr_dirt_save',
            'autoSaveIntervalMs': 10000,
            'rollingBackupIntervalMs': 300000,
            'maxBackups': 5,
            'offlineCapSeconds': 7200,
            'offlineModalMinSeconds': 60
        },
        'ui': {
            'maxContentWidthPx': 640,
            'resourceBarTopCount': 4,
            'stagnationHintSeconds': 60,
            'toastDurationMs': 3000,
            'purchaseMultipliers': [1, 10, 100, 'MAX'],
            'sidebarDefaultPosition': 'right',
            'sidebarTransitionMs': 300,
            'actionBarHeightPx': 64,
            'tapAction': {'percentOfPrimaryCurrencyRate': 0.10, 'minGain': 1, 'cooldownMs': 0},
            'actionBar': {'maxSkillSlots': 4, 'maxBoostSlots': 4}
        },
        'numberFormat': {
            'thresholds': [
                {'suffix': 'K', 'value': 1000},
                {'suffix': 'M', 'value': 1000000},
                {'suffix': 'B', 'value': 1000000000},
                {'suffix': 'T', 'value': 1000000000000}
            ],
            'displayPrecision': 2
        },
        'characters': {'maxActive': 3},
        'equipmentSlots': [
            {'id': 'tool', 'label': 'Tool', 'row': 0, 'col': 0},
            {'id': 'head', 'label': 'Head', 'row': 0, 'col': 1},
            {'id': 'charm', 'label': 'Charm', 'row': 0, 'col': 2},
            {'id': 'mainHand', 'label': 'Main hand', 'row': 1, 'col': 0},
            {'id': 'body', 'label': 'Body', 'row': 1, 'col': 1},
            {'id': 'offHand', 'label': 'Off hand', 'row': 1, 'col': 2},
            {'id': 'feet', 'label': 'Feet', 'row': 2, 'col': 0},
            {'id': 'waist', 'label': 'Waist', 'row': 2, 'col': 1},
            {'id': 'companion', 'label': 'Companion', 'row': 2, 'col': 2}
        ],
        'equipment': {
            'defaultRarity': 'common',
            'stackBonusPerCopy': 0.02,
            'rarityMultipliers': {'common': 1, 'uncommon': 1.15, 'rare': 1.35, 'epic': 1.6, 'legendary': 2},
            'rarityOrder': ['common', 'uncommon', 'rare', 'epic', 'legendary']
        },
        'devTools': {
            'speedMultipliers': [1, 2, 5, 10],
            'resourceGrantAmount': 1000,
            'maxBulkPurchaseIterations': 10000
        },
        'generatorTiers': {str(k): v for k, v in GENERATOR_TIERS.items()},
        'resourceUnlockByTier': {
            '0': ['stone', 'wood', 'food'],
            '1': ['copper', 'bronze'],
            '2': ['iron', 'gold'],
            '3': ['coal', 'steel', 'electricity'],
            '4': ['data', 'compute', 'intelligence']
        }
    })

    write('resources.json', {
        'resources': [
            {'codeName': 'stone', 'displayName': 'Stone', 'description': 'Raw stone — the foundation of early civilization.', 'icon': '🪨', 'color': '#78716c', 'isPrimary': True, 'baseValue': 0},
            {'codeName': 'wood', 'displayName': 'Wood', 'description': 'Timber for tools, shelter, and fire.', 'icon': '🪵', 'color': '#92400e', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'food', 'displayName': 'Food', 'description': 'Sustenance for your growing tribe.', 'icon': '🍖', 'color': '#ea580c', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'copper', 'displayName': 'Copper', 'description': 'First metal of the Bronze Age.', 'icon': '🟤', 'color': '#b45309', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'bronze', 'displayName': 'Bronze', 'description': 'Alloy that unlocks advanced tools.', 'icon': '🔶', 'color': '#d97706', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'iron', 'displayName': 'Iron', 'description': 'Strong metal of empires and war.', 'icon': '⚙️', 'color': '#52525b', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'gold', 'displayName': 'Gold', 'description': 'Wealth that fuels trade routes.', 'icon': '🪙', 'color': '#eab308', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'coal', 'displayName': 'Coal', 'description': 'Fuel of the industrial revolution.', 'icon': '⬛', 'color': '#1c1917', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'steel', 'displayName': 'Steel', 'description': 'Industrial backbone of modern industry.', 'icon': '🔩', 'color': '#64748b', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'electricity', 'displayName': 'Electricity', 'description': 'Power that lights the modern world.', 'icon': '⚡', 'color': '#facc15', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'data', 'displayName': 'Data', 'description': 'Digital raw material of the information age.', 'icon': '💾', 'color': '#06b6d4', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'compute', 'displayName': 'Compute', 'description': 'Processing power for machine learning.', 'icon': '🖥️', 'color': '#8b5cf6', 'isPrimary': False, 'baseValue': 0},
            {'codeName': 'intelligence', 'displayName': 'Intelligence', 'description': 'Synthetic cognition — the fruit of AGI.', 'icon': '🧠', 'color': '#ec4899', 'isPrimary': False, 'baseValue': 0}
        ]
    })

    write('generators.json', {
        'generators': [
            {
                'codeName': 'rockGatherer', 'displayName': 'Rock Gatherer', 'icon': '🪨', 'category': 'stone',
                'description': 'Collects stone from riverbeds and outcrops.',
                'unlockConditions': None, 'baseCost': 10, 'costMultiplier': 1.15,
                'costResources': [{'resource': 'stone', 'multiplier': 1}],
                'produces': [
                    {'resource': 'stone', 'amount': 1, 'role': 'primary'},
                    {'resource': 'wood', 'amount': 0.3, 'role': 'unlockGate', 'forGenerator': 'woodcutter'}
                ]
            },
            {
                'codeName': 'woodcutter', 'displayName': 'Woodcutter', 'icon': '🪓', 'category': 'stone',
                'description': 'Fells trees and prepares timber.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'rockGatherer', 'quantity': 1},
                    {'type': 'resourceHeld', 'resource': 'wood', 'amount': 10}
                ]},
                'baseCost': 50, 'costMultiplier': 1.15,
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'wood', 'multiplier': 1}],
                'produces': [
                    {'resource': 'wood', 'amount': 1, 'role': 'primary'},
                    {'resource': 'food', 'amount': 0.4, 'role': 'unlockGate', 'forGenerator': 'campfire'}
                ]
            },
            {
                'codeName': 'campfire', 'displayName': 'Campfire', 'icon': '🔥', 'category': 'stone',
                'description': 'Cooks food and preserves tribal knowledge.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'woodcutter', 'quantity': 3},
                    {'type': 'resourceHeld', 'resource': 'food', 'amount': 25}
                ]},
                'baseCost': 200, 'costMultiplier': 1.16,
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'wood', 'multiplier': 2}, {'resource': 'food', 'multiplier': 1}],
                'produces': [
                    {'resource': 'food', 'amount': 1.5, 'role': 'primary'},
                    {'resource': 'stone', 'amount': 0.5, 'role': 'bonus'},
                    {'resource': 'copper', 'amount': 0.05, 'role': 'unlockGate', 'forGenerator': 'copperMine'}
                ]
            },
            {
                'codeName': 'copperMine', 'displayName': 'Copper Mine', 'icon': '⛏️', 'category': 'bronze',
                'description': 'Extracts copper ore from shallow deposits.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'ascensionTier', 'minTier': 1},
                    {'type': 'resourceHeld', 'resource': 'copper', 'amount': 20}
                ]},
                'baseCost': 1500, 'costMultiplier': 1.17, 'requiredFeature': 'generators:tier1',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'food', 'multiplier': 2}, {'resource': 'copper', 'multiplier': 1}],
                'produces': [
                    {'resource': 'copper', 'amount': 1, 'role': 'primary'},
                    {'resource': 'bronze', 'amount': 0.1, 'role': 'unlockGate', 'forGenerator': 'bronzeSmelter'}
                ]
            },
            {
                'codeName': 'bronzeSmelter', 'displayName': 'Bronze Smelter', 'icon': '🏺', 'category': 'bronze',
                'description': 'Smelts copper into bronze alloy.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'copperMine', 'quantity': 2},
                    {'type': 'resourceHeld', 'resource': 'bronze', 'amount': 15}
                ]},
                'baseCost': 8000, 'costMultiplier': 1.18, 'requiredFeature': 'generators:tier1',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'copper', 'multiplier': 3}, {'resource': 'bronze', 'multiplier': 1}],
                'produces': [
                    {'resource': 'bronze', 'amount': 1.2, 'role': 'primary'},
                    {'resource': 'iron', 'amount': 0.08, 'role': 'unlockGate', 'forGenerator': 'ironMine'}
                ]
            },
            {
                'codeName': 'bronzeForge', 'displayName': 'Bronze Forge', 'icon': '🔨', 'category': 'bronze',
                'description': 'Forges bronze tools and weapons.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'bronzeSmelter', 'quantity': 3},
                    {'type': 'resourceHeld', 'resource': 'bronze', 'amount': 100}
                ]},
                'baseCost': 40000, 'costMultiplier': 1.19, 'requiredFeature': 'generators:tier1',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'bronze', 'multiplier': 5}],
                'produces': [
                    {'resource': 'bronze', 'amount': 3, 'role': 'primary'},
                    {'resource': 'stone', 'amount': 2, 'role': 'bonus'},
                    {'resource': 'iron', 'amount': 0.15, 'role': 'unlockGate', 'forGenerator': 'ironMine'}
                ]
            },
            {
                'codeName': 'ironMine', 'displayName': 'Iron Mine', 'icon': '🏔️', 'category': 'medieval',
                'description': 'Deep mines yield iron for empires.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'ascensionTier', 'minTier': 2},
                    {'type': 'resourceHeld', 'resource': 'iron', 'amount': 50}
                ]},
                'baseCost': 200000, 'costMultiplier': 1.20, 'requiredFeature': 'generators:tier2',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'bronze', 'multiplier': 3}, {'resource': 'iron', 'multiplier': 1}],
                'produces': [
                    {'resource': 'iron', 'amount': 1, 'role': 'primary'},
                    {'resource': 'gold', 'amount': 0.05, 'role': 'unlockGate', 'forGenerator': 'tradeCaravan'}
                ]
            },
            {
                'codeName': 'blacksmith', 'displayName': 'Blacksmith', 'icon': '⚒️', 'category': 'medieval',
                'description': 'Shapes iron into tools of conquest.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'ironMine', 'quantity': 3},
                    {'type': 'resourceHeld', 'resource': 'iron', 'amount': 200}
                ]},
                'baseCost': 1000000, 'costMultiplier': 1.21, 'requiredFeature': 'generators:tier2',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'iron', 'multiplier': 5}],
                'produces': [
                    {'resource': 'iron', 'amount': 2.5, 'role': 'primary'},
                    {'resource': 'gold', 'amount': 0.1, 'role': 'unlockGate', 'forGenerator': 'tradeCaravan'},
                    {'resource': 'coal', 'amount': 0.02, 'role': 'unlockGate', 'forGenerator': 'coalMine'}
                ]
            },
            {
                'codeName': 'tradeCaravan', 'displayName': 'Trade Caravan', 'icon': '🐪', 'category': 'medieval',
                'description': 'Routes goods and gold across kingdoms.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'blacksmith', 'quantity': 2},
                    {'type': 'resourceHeld', 'resource': 'gold', 'amount': 100}
                ]},
                'baseCost': 5000000, 'costMultiplier': 1.22, 'requiredFeature': 'generators:tier2',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'iron', 'multiplier': 10}, {'resource': 'gold', 'multiplier': 1}],
                'produces': [
                    {'resource': 'gold', 'amount': 1, 'role': 'primary'},
                    {'resource': 'stone', 'amount': 10, 'role': 'bonus'},
                    {'resource': 'iron', 'amount': 0.5, 'role': 'bonus'},
                    {'resource': 'coal', 'amount': 0.1, 'role': 'unlockGate', 'forGenerator': 'coalMine'}
                ]
            },
            {
                'codeName': 'coalMine', 'displayName': 'Coal Mine', 'icon': '⬛', 'category': 'industrial',
                'description': 'Fuels the furnaces of industry.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'ascensionTier', 'minTier': 3},
                    {'type': 'resourceHeld', 'resource': 'coal', 'amount': 100}
                ]},
                'baseCost': 50000000, 'costMultiplier': 1.23, 'requiredFeature': 'generators:tier3',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'iron', 'multiplier': 5}, {'resource': 'coal', 'multiplier': 1}],
                'produces': [
                    {'resource': 'coal', 'amount': 1.5, 'role': 'primary'},
                    {'resource': 'steel', 'amount': 0.1, 'role': 'unlockGate', 'forGenerator': 'steelMill'}
                ]
            },
            {
                'codeName': 'steelMill', 'displayName': 'Steel Mill', 'icon': '🏭', 'category': 'industrial',
                'description': 'Mass-produces steel from coal and iron.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'coalMine', 'quantity': 3},
                    {'type': 'resourceHeld', 'resource': 'steel', 'amount': 50}
                ]},
                'baseCost': 500000000, 'costMultiplier': 1.24, 'requiredFeature': 'generators:tier3',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'coal', 'multiplier': 5}, {'resource': 'steel', 'multiplier': 1}],
                'produces': [
                    {'resource': 'steel', 'amount': 1, 'role': 'primary'},
                    {'resource': 'electricity', 'amount': 0.05, 'role': 'unlockGate', 'forGenerator': 'powerPlant'}
                ]
            },
            {
                'codeName': 'powerPlant', 'displayName': 'Power Plant', 'icon': '⚡', 'category': 'industrial',
                'description': 'Generates electricity for the modern age.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'steelMill', 'quantity': 2},
                    {'type': 'resourceHeld', 'resource': 'electricity', 'amount': 100}
                ]},
                'baseCost': 5000000000, 'costMultiplier': 1.25, 'requiredFeature': 'generators:tier3',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'steel', 'multiplier': 10}, {'resource': 'electricity', 'multiplier': 1}],
                'produces': [
                    {'resource': 'electricity', 'amount': 2, 'role': 'primary'},
                    {'resource': 'stone', 'amount': 100, 'role': 'bonus'},
                    {'resource': 'data', 'amount': 0.02, 'role': 'unlockGate', 'forGenerator': 'dataCenter'}
                ]
            },
            {
                'codeName': 'dataCenter', 'displayName': 'Data Center', 'icon': '🖥️', 'category': 'digital',
                'description': 'Stores and processes the world\'s information.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'ascensionTier', 'minTier': 4},
                    {'type': 'resourceHeld', 'resource': 'data', 'amount': 100}
                ]},
                'baseCost': 50000000000, 'costMultiplier': 1.26, 'requiredFeature': 'generators:tier4',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'electricity', 'multiplier': 5}, {'resource': 'data', 'multiplier': 1}],
                'produces': [
                    {'resource': 'data', 'amount': 1, 'role': 'primary'},
                    {'resource': 'compute', 'amount': 0.1, 'role': 'unlockGate', 'forGenerator': 'mlLaboratory'}
                ]
            },
            {
                'codeName': 'mlLaboratory', 'displayName': 'ML Laboratory', 'icon': '🧪', 'category': 'digital',
                'description': 'Trains models on vast datasets.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'dataCenter', 'quantity': 2},
                    {'type': 'resourceHeld', 'resource': 'compute', 'amount': 50}
                ]},
                'baseCost': 500000000000, 'costMultiplier': 1.27, 'requiredFeature': 'generators:tier4',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'data', 'multiplier': 5}, {'resource': 'compute', 'multiplier': 1}],
                'produces': [
                    {'resource': 'compute', 'amount': 1.5, 'role': 'primary'},
                    {'resource': 'intelligence', 'amount': 0.05, 'role': 'unlockGate', 'forGenerator': 'agiCore'}
                ]
            },
            {
                'codeName': 'agiCore', 'displayName': 'AGI Core', 'icon': '🧠', 'category': 'digital',
                'description': 'Artificial general intelligence — humanity\'s next chapter.',
                'unlockConditions': {'operator': 'AND', 'conditions': [
                    {'type': 'generatorOwned', 'generator': 'mlLaboratory', 'quantity': 1},
                    {'type': 'resourceHeld', 'resource': 'intelligence', 'amount': 25}
                ]},
                'baseCost': 5000000000000, 'costMultiplier': 1.30, 'requiredFeature': 'generators:tier4',
                'costResources': [{'resource': 'stone', 'multiplier': 1}, {'resource': 'compute', 'multiplier': 20}, {'resource': 'intelligence', 'multiplier': 1}],
                'produces': [
                    {'resource': 'stone', 'amount': 10000, 'role': 'primary'},
                    {'resource': 'intelligence', 'amount': 5, 'role': 'bonus'},
                    {'resource': 'compute', 'amount': 10, 'role': 'bonus'}
                ]
            }
        ]
    })

    # Remaining configs — streamlined but functional
    write('difficulty.json', {
        'profiles': {
            'tier0': {'costMultiplier': 1.0, 'primaryCurrencyMultiplier': 1.0, 'offlineEfficiency': 1.0},
            'tier1': {'costMultiplier': 1.5, 'primaryCurrencyMultiplier': 1.2, 'offlineEfficiency': 0.95},
            'tier2': {'costMultiplier': 2.5, 'primaryCurrencyMultiplier': 1.5, 'offlineEfficiency': 0.9},
            'tier3': {'costMultiplier': 4.0, 'primaryCurrencyMultiplier': 2.0, 'offlineEfficiency': 0.85},
            'tier4': {'costMultiplier': 6.0, 'primaryCurrencyMultiplier': 3.0, 'offlineEfficiency': 0.8}
        },
        'stacking': 'multiplicative',
        'prestigeDifficultyPerCount': {
            'costIncreasePerPrestige': 0.02,
            'primaryCurrencyDecreasePerPrestige': 0.01
        }
    })

    write('upgrades.json', {
        'upgrades': [
            {'codeName': 'sharperTools', 'displayName': 'Sharper Tools', 'description': '+10% stone production per level', 'icon': '🪓', 'cost': 50, 'costResource': 'stone', 'costScale': 1.12, 'maxLevel': 25, 'effect': {'type': 'globalMultiplier', 'multiplier': 1.1}},
            {'codeName': 'betterForaging', 'displayName': 'Better Foraging', 'description': '+15% tap power per level', 'icon': '👆', 'cost': 100, 'costResource': 'stone', 'costScale': 1.15, 'maxLevel': 20, 'effect': {'type': 'clickMultiplier', 'multiplier': 1.15}},
            {'codeName': 'efficientLabor', 'displayName': 'Efficient Labor', 'description': '-3% costs per level', 'icon': '📉', 'cost': 200, 'costResource': 'stone', 'costScale': 1.18, 'maxLevel': 15, 'effect': {'type': 'costReduction', 'multiplier': 0.97}}
        ]
    })

    write('items.json', {
        'items': [
            {'codeName': 'rationPack', 'displayName': 'Ration Pack', 'description': 'Boosts production briefly.', 'icon': '🍱', 'type': 'consumable', 'actionBarEligible': True, 'effect': {'type': 'globalMultiplier', 'multiplier': 1.5, 'durationSeconds': 30}},
            {'codeName': 'energyDrink', 'displayName': 'Energy Drink', 'description': 'Boosts manual labor (taps).', 'icon': '🥤', 'type': 'consumable', 'actionBarEligible': True, 'effect': {'type': 'clickMultiplier', 'multiplier': 2.5, 'durationSeconds': 20}},
            {'codeName': 'stonePick', 'displayName': 'Stone Pick', 'description': 'Basic gathering tool.', 'icon': '⛏️', 'type': 'equipable', 'slot': 'tool', 'rarity': 'common', 'stackable': True, 'effect': {'type': 'globalMultiplier', 'multiplier': 1.05}},
            {'codeName': 'leafCrown', 'displayName': 'Leaf Crown', 'description': 'Tribal headwear.', 'icon': '🌿', 'type': 'equipable', 'slot': 'head', 'rarity': 'common', 'stackable': True, 'effect': {'type': 'clickMultiplier', 'multiplier': 1.08}},
            {'codeName': 'boneCharm', 'displayName': 'Bone Charm', 'description': 'Ancestral charm.', 'icon': '🦴', 'type': 'equipable', 'slot': 'charm', 'rarity': 'uncommon', 'stackable': True, 'effect': {'type': 'costReduction', 'multiplier': 0.95}}
        ]
    })

    write('artifacts.json', {
        'artifacts': [
            {'codeName': 'firstFlint', 'displayName': 'First Flint', 'description': '+5% all production', 'icon': '🔥', 'rarity': 'common', 'effect': {'type': 'globalMultiplier', 'multiplier': 1.05}, 'dropRequirements': {'generator': 'rockGatherer', 'minAscensionTier': 0}},
            {'codeName': 'bronzeTablet', 'displayName': 'Bronze Tablet', 'description': '+10% bronze generators', 'icon': '📜', 'rarity': 'uncommon', 'effect': {'type': 'categoryMultiplier', 'category': 'bronze', 'multiplier': 1.1}, 'dropRequirements': {'generator': 'bronzeForge', 'minAscensionTier': 1}},
            {'codeName': 'ironCrown', 'displayName': 'Iron Crown', 'description': '+12% global production', 'icon': '👑', 'rarity': 'rare', 'effect': {'type': 'globalMultiplier', 'multiplier': 1.12}, 'dropRequirements': {'generator': 'blacksmith', 'minAscensionTier': 2}},
            {'codeName': 'steamEngine', 'displayName': 'Steam Engine', 'description': '+15% industrial generators', 'icon': '🚂', 'rarity': 'epic', 'effect': {'type': 'categoryMultiplier', 'category': 'industrial', 'multiplier': 1.15}, 'dropRequirements': {'generator': 'powerPlant', 'minAscensionTier': 3}},
            {'codeName': 'neuralChip', 'displayName': 'Neural Chip', 'description': 'Double tap power', 'icon': '💾', 'rarity': 'legendary', 'effect': {'type': 'clickMultiplier', 'multiplier': 2}, 'dropRequirements': {'generator': 'agiCore', 'minAscensionTier': 4}}
        ]
    })

    write('characters.json', {
        'characters': [
            {'codeName': 'tribalElder', 'displayName': 'Tribal Elder', 'icon': '🧓', 'description': 'Wise leader of the stone-age tribe.',
             'unlockConditions': None, 'baseStats': {'globalMultiplier': 1.05},
             'activeSkill': {'codeName': 'rally', 'displayName': 'Rally', 'icon': '📣', 'cooldownSeconds': 45, 'effect': {'type': 'globalMultiplier', 'multiplier': 2, 'durationSeconds': 15}}},
            {'codeName': 'bronzeSmith', 'displayName': 'Bronze Smith', 'icon': '🔨', 'description': 'Master of the bronze age forge.',
             'unlockConditions': {'operator': 'AND', 'conditions': [{'type': 'ascensionTier', 'minTier': 1}, {'type': 'generatorOwned', 'generator': 'bronzeForge', 'quantity': 1}]},
             'baseStats': {'categoryMultiplier': {'category': 'bronze', 'multiplier': 1.15}},
             'activeSkill': {'codeName': 'moltenBurst', 'displayName': 'Molten Burst', 'icon': '🔥', 'cooldownSeconds': 50, 'effect': {'type': 'globalMultiplier', 'multiplier': 2.5, 'durationSeconds': 12}}},
            {'codeName': 'industrialist', 'displayName': 'Industrialist', 'icon': '🏭', 'description': 'Titan of the industrial revolution.',
             'unlockConditions': {'operator': 'AND', 'conditions': [{'type': 'ascensionTier', 'minTier': 3}, {'type': 'lifetimePrestiges', 'min': 3}]},
             'baseStats': {'categoryMultiplier': {'category': 'industrial', 'multiplier': 1.2}},
             'activeSkill': {'codeName': 'massProduction', 'displayName': 'Mass Production', 'icon': '⚙️', 'cooldownSeconds': 60, 'effect': {'type': 'globalMultiplier', 'multiplier': 3, 'durationSeconds': 10}}}
        ]
    })

    write('achievements.json', {
        'achievements': [
            {'codeName': 'firstTap', 'displayName': 'First Labor', 'description': 'Perform your first tap.', 'icon': '👆', 'requirement': {'type': 'totalTaps', 'amount': 1}, 'reward': {'type': 'modifierUnlock', 'effect': {'type': 'clickMultiplier', 'multiplier': 1.05}}},
            {'codeName': 'firstGenerator', 'displayName': 'Tool User', 'description': 'Own a Rock Gatherer.', 'icon': '🪨', 'requirement': {'type': 'generatorOwned', 'generator': 'rockGatherer', 'amount': 1}, 'reward': {'type': 'modifierUnlock', 'effect': {'type': 'globalMultiplier', 'multiplier': 1.05}}},
            {'codeName': 'firstPrestige', 'displayName': 'New Beginning', 'description': 'Perform your first prestige.', 'icon': '🔄', 'requirement': {'type': 'prestigeCount', 'amount': 1}, 'reward': {'type': 'modifierUnlock', 'effect': {'type': 'globalMultiplier', 'multiplier': 1.03}}},
            {'codeName': 'bronzeAge', 'displayName': 'Bronze Dawn', 'description': 'Ascend to the Bronze Age.', 'icon': '🔶', 'requirement': {'type': 'ascensionTier', 'minTier': 1}, 'reward': {'type': 'modifierUnlock', 'effect': {'type': 'globalMultiplier', 'multiplier': 1.06}}},
            {'codeName': 'medievalEra', 'displayName': 'Age of Empires', 'description': 'Ascend to the Medieval Era.', 'icon': '🏰', 'requirement': {'type': 'ascensionTier', 'minTier': 2}, 'reward': {'type': 'modifierUnlock', 'effect': {'type': 'globalMultiplier', 'multiplier': 1.08}}},
            {'codeName': 'industrialRev', 'displayName': 'Industrial Revolution', 'description': 'Ascend to the Industrial Age.', 'icon': '🏭', 'requirement': {'type': 'ascensionTier', 'minTier': 3}, 'reward': {'type': 'modifierUnlock', 'effect': {'type': 'globalMultiplier', 'multiplier': 1.1}}},
            {'codeName': 'aiAge', 'displayName': 'Singularity', 'description': 'Ascend to the AI Age.', 'icon': '🧠', 'requirement': {'type': 'ascensionTier', 'minTier': 4}, 'reward': {'type': 'modifierUnlock', 'effect': {'type': 'globalMultiplier', 'multiplier': 1.15}}}
        ]
    })

    write('events.json', {
        'events': [
            {'codeName': 'bountifulHarvest', 'displayName': 'Bountiful Harvest', 'icon': '🌾', 'description': 'Double food production.', 'duration': 30, 'minInterval': 120, 'maxInterval': 300, 'effect': {'type': 'globalMultiplier', 'multiplier': 2}},
            {'codeName': 'inspiration', 'displayName': 'Flash of Inspiration', 'icon': '💡', 'description': 'Triple tap power.', 'duration': 20, 'minInterval': 180, 'maxInterval': 400, 'effect': {'type': 'clickMultiplier', 'multiplier': 3}}
        ]
    })

    write('drops.json', {
        'dropTables': [
            {'codeName': 'passiveTick', 'trigger': 'tick', 'chancePerSecond': 0.08, 'entries': [
                {'item': 'rationPack', 'weight': 70, 'quantity': [1, 1]},
                {'item': 'energyDrink', 'weight': 30, 'quantity': [1, 1]}
            ]},
            {'codeName': 'onClick', 'trigger': 'click', 'chance': 0.02, 'entries': [
                {'item': 'rationPack', 'weight': 60, 'quantity': [1, 2]},
                {'item': 'energyDrink', 'weight': 40, 'quantity': [1, 1]}
            ]},
            {'codeName': 'equipmentDrop', 'trigger': 'tick', 'chancePerSecond': 0.01, 'dynamicTierWeights': True, 'entries': [
                {'item': 'stonePick', 'weight': 40, 'quantity': [1, 1], 'dropTier': 'common'},
                {'item': 'leafCrown', 'weight': 35, 'quantity': [1, 1], 'dropTier': 'common'},
                {'item': 'boneCharm', 'weight': 25, 'quantity': [1, 1], 'dropTier': 'uncommon'}
            ]},
            {'codeName': 'artifactDrop', 'trigger': 'tick', 'chancePerSecond': 0.0008, 'entries': [
                {'artifact': 'firstFlint', 'weight': 40},
                {'artifact': 'bronzeTablet', 'weight': 25, 'dropRequirements': {'generator': 'bronzeForge', 'minAscensionTier': 1}},
                {'artifact': 'ironCrown', 'weight': 20, 'dropRequirements': {'generator': 'blacksmith', 'minAscensionTier': 2}},
                {'artifact': 'steamEngine', 'weight': 10, 'dropRequirements': {'generator': 'powerPlant', 'minAscensionTier': 3}},
                {'artifact': 'neuralChip', 'weight': 5, 'dropRequirements': {'generator': 'agiCore', 'minAscensionTier': 4}}
            ]}
        ],
        'equipmentDropModifiers': {
            'tierWeightsByAscension': {
                '0': {'common': 0.8, 'uncommon': 0.18, 'rare': 0.02},
                '1': {'common': 0.6, 'uncommon': 0.3, 'rare': 0.1},
                '2': {'common': 0.45, 'uncommon': 0.4, 'rare': 0.15},
                '3': {'common': 0.3, 'uncommon': 0.45, 'rare': 0.25},
                '4': {'common': 0.2, 'uncommon': 0.4, 'rare': 0.4}
            },
            'quantityBonusPerGenerator': 0.002
        }
    })

    write('ascension.json', {
        'maxTier': 4,
        'ascensionTiers': [
            {'tier': 0, 'codeName': 'stoneAge', 'displayName': 'Stone Age', 'isStartingTier': True, 'difficultyProfile': 'tier0',
             'unlockedFeatures': ['tab:generators', 'tab:upgrades', 'tab:achievements', 'tab:stats', 'tab:settings', 'tab:ascension', 'generators:tier0', 'prestigeShop:tier0']},
            {'tier': 1, 'codeName': 'bronzeAge', 'displayName': 'Bronze Age', 'difficultyProfile': 'tier1',
             'ascensionRequirements': {'operator': 'AND', 'conditions': [
                 {'type': 'prestigeCount', 'min': 2},
                 {'type': 'lifetimeResourcesGenerated', 'resource': 'stone', 'min': 100000},
                 {'type': 'lifetimeGeneratorPurchases', 'min': 50}
             ]},
             'onAscend': {'clearCurrency': True, 'clearGeneratorQuantities': True, 'keepGeneratorUnlocks': True, 'clearUpgrades': False, 'clearInventory': False, 'clearArtifacts': False},
             'unlockedFeatures': ['systems:drops', 'tab:characters', 'tab:inventory', 'generators:tier1', 'prestigeShop:tier1', 'resources:copper', 'resources:bronze']},
            {'tier': 2, 'codeName': 'medieval', 'displayName': 'Medieval Era', 'difficultyProfile': 'tier2',
             'ascensionRequirements': {'operator': 'AND', 'conditions': [
                 {'type': 'prestigeCount', 'min': 5},
                 {'type': 'lifetimeResourcesGenerated', 'resource': 'stone', 'min': 10000000},
                 {'type': 'lifetimeGeneratorPurchases', 'min': 200}
             ]},
             'onAscend': {'clearCurrency': True, 'clearGeneratorQuantities': True, 'keepGeneratorUnlocks': True, 'clearUpgrades': False, 'clearInventory': False, 'clearArtifacts': False},
             'unlockedFeatures': ['tab:artifacts', 'generators:tier2', 'prestigeShop:tier2', 'resources:iron', 'resources:gold']},
            {'tier': 3, 'codeName': 'industrial', 'displayName': 'Industrial Age', 'difficultyProfile': 'tier3',
             'ascensionRequirements': {'operator': 'AND', 'conditions': [
                 {'type': 'prestigeCount', 'min': 8},
                 {'type': 'lifetimeResourcesGenerated', 'resource': 'stone', 'min': 1000000000},
                 {'type': 'lifetimeGeneratorPurchases', 'min': 500}
             ]},
             'onAscend': {'clearCurrency': True, 'clearGeneratorQuantities': True, 'keepGeneratorUnlocks': True, 'clearUpgrades': False, 'clearInventory': False, 'clearArtifacts': False},
             'unlockedFeatures': ['systems:randomEvents', 'generators:tier3', 'prestigeShop:tier3', 'resources:coal', 'resources:steel', 'resources:electricity']},
            {'tier': 4, 'codeName': 'aiAge', 'displayName': 'AI Age', 'difficultyProfile': 'tier4',
             'ascensionRequirements': {'operator': 'AND', 'conditions': [
                 {'type': 'prestigeCount', 'min': 15},
                 {'type': 'lifetimeResourcesGenerated', 'resource': 'stone', 'min': 1000000000000},
                 {'type': 'lifetimeGeneratorPurchases', 'min': 2000}
             ]},
             'onAscend': {'clearCurrency': True, 'clearGeneratorQuantities': True, 'keepGeneratorUnlocks': True, 'clearUpgrades': False, 'clearInventory': False, 'clearArtifacts': False},
             'unlockedFeatures': ['generators:tier4', 'prestigeShop:tier4', 'resources:data', 'resources:compute', 'resources:intelligence']}
        ]
    })

    write('prestige.json', {
        'prestigeCurrency': {
            'codeName': 'legacyPoints', 'displayName': 'Legacy Points',
            'gainFormula': 'logarithmic', 'logBase': 10, 'minimumResourceValue': 1000,
            'milestoneExponent': 2,
            'resourceWeights': {'stone': 1, 'wood': 0.4, 'food': 0.3, 'copper': 0.5, 'bronze': 0.6, 'iron': 0.7, 'gold': 0.8, 'coal': 0.9, 'steel': 1.0, 'electricity': 1.1, 'data': 1.2, 'compute': 1.3, 'intelligence': 1.5},
            'rulesExplanation': 'Legacy Points from weighted civilization progress (resources available in your current age only). Each point requires exponentially more weighted value.'
        },
        'prestigeMinimumBase': {'operator': 'AND', 'conditions': [
            {'type': 'resourceHeld', 'resource': 'stone', 'amount': 1000},
            {'type': 'resourceHeld', 'resource': 'wood', 'amount': 500},
            {'type': 'resourceHeld', 'resource': 'food', 'amount': 100}
        ]},
        'prestigeMinimumTierResources': {
            '1': [{'resource': 'copper', 'amount': 50}],
            '2': [{'resource': 'iron', 'amount': 200}],
            '3': [{'resource': 'coal', 'amount': 150}],
            '4': [{'resource': 'data', 'amount': 100}]
        },
        'prestigeMinimumScalePerPrestige': 0.2,
        'featureUnlocks': [
            {'feature': 'tab:characters', 'unlockConditions': {'operator': 'AND', 'conditions': [{'type': 'lifetimePrestiges', 'min': 1}]}},
            {'feature': 'tab:inventory', 'unlockConditions': {'operator': 'AND', 'conditions': [{'type': 'lifetimePrestiges', 'min': 1}]}},
            {'feature': 'systems:drops', 'unlockConditions': {'operator': 'AND', 'conditions': [{'type': 'lifetimePrestiges', 'min': 1}]}},
            {'feature': 'tab:artifacts', 'unlockConditions': {'operator': 'AND', 'conditions': [{'type': 'lifetimePrestiges', 'min': 2}]}}
        ],
        'onPrestige': {
            'clearCurrency': True, 'clearGeneratorQuantities': True, 'keepGeneratorUnlocks': True,
            'clearUpgrades': True, 'clearInventory': False, 'clearArtifacts': False,
            'clearTemporaryBuffs': True, 'resetRunStats': True, 'resetPrestigeShopAllocation': True
        },
        'startingResourcesAfterPrestige': {'stone': 10},
        'prestigeBonuses': [
            {'codeName': 'tribalWisdom', 'displayName': 'Tribal Wisdom', 'description': '+5% stone per level', 'icon': '📿', 'cost': 1, 'maxLevel': 25, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.05}, 'requiredFeature': 'prestigeShop:tier0'},
            {'codeName': 'strongArms', 'displayName': 'Strong Arms', 'description': '+10% tap per level', 'icon': '💪', 'cost': 2, 'maxLevel': 15, 'effect': {'type': 'clickMultiplier', 'multiplierPerLevel': 0.10}, 'requiredFeature': 'prestigeShop:tier0'},
            {'codeName': 'campfireTales', 'displayName': 'Campfire Tales', 'description': '+3% offline efficiency per level', 'icon': '🔥', 'cost': 2, 'maxLevel': 10, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.03}, 'requiredFeature': 'prestigeShop:tier0'},
            {'codeName': 'bronzeMastery', 'displayName': 'Bronze Mastery', 'description': '+8% bronze generators per level', 'icon': '🔶', 'cost': 3, 'maxLevel': 12, 'effect': {'type': 'categoryMultiplier', 'category': 'bronze', 'multiplierPerLevel': 0.08}, 'requiredFeature': 'prestigeShop:tier1'},
            {'codeName': 'tradeRoutes', 'displayName': 'Trade Routes', 'description': '+6% medieval generators per level', 'icon': '🐪', 'cost': 3, 'maxLevel': 12, 'effect': {'type': 'categoryMultiplier', 'category': 'medieval', 'multiplierPerLevel': 0.06}, 'requiredFeature': 'prestigeShop:tier1'},
            {'codeName': 'writtenWord', 'displayName': 'Written Word', 'description': '+4% global per level', 'icon': '📜', 'cost': 2, 'maxLevel': 10, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.04}, 'requiredFeature': 'prestigeShop:tier1'},
            {'codeName': 'assemblyLine', 'displayName': 'Assembly Line', 'description': '-2% costs per level', 'icon': '⚙️', 'cost': 3, 'maxLevel': 10, 'effect': {'type': 'costReduction', 'multiplierPerLevel': 0.02}, 'requiredFeature': 'prestigeShop:tier2'},
            {'codeName': 'steelWorks', 'displayName': 'Steel Works', 'description': '+8% industrial generators per level', 'icon': '🏭', 'cost': 4, 'maxLevel': 10, 'effect': {'type': 'categoryMultiplier', 'category': 'industrial', 'multiplierPerLevel': 0.08}, 'requiredFeature': 'prestigeShop:tier2'},
            {'codeName': 'invention', 'displayName': 'Invention', 'description': '+5% global per level', 'icon': '💡', 'cost': 4, 'maxLevel': 15, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.05}, 'requiredFeature': 'prestigeShop:tier3'},
            {'codeName': 'electricGrid', 'displayName': 'Electric Grid', 'description': '+7% industrial generators per level', 'icon': '⚡', 'cost': 5, 'maxLevel': 12, 'effect': {'type': 'categoryMultiplier', 'category': 'industrial', 'multiplierPerLevel': 0.07}, 'requiredFeature': 'prestigeShop:tier3'},
            {'codeName': 'massMedia', 'displayName': 'Mass Media', 'description': '+4% global per level', 'icon': '📺', 'cost': 5, 'maxLevel': 10, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.04}, 'requiredFeature': 'prestigeShop:tier3'},
            {'codeName': 'cloudScale', 'displayName': 'Cloud Scale', 'description': '+6% global per level', 'icon': '☁️', 'cost': 5, 'maxLevel': 20, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.06}, 'requiredFeature': 'prestigeShop:tier4'},
            {'codeName': 'neuralNet', 'displayName': 'Neural Net', 'description': '+5% tap per level', 'icon': '🧠', 'cost': 5, 'maxLevel': 15, 'effect': {'type': 'clickMultiplier', 'multiplierPerLevel': 0.05}, 'requiredFeature': 'prestigeShop:tier4'},
            {'codeName': 'singularity', 'displayName': 'Singularity Core', 'description': '-3% costs per level', 'icon': '♾️', 'cost': 6, 'maxLevel': 10, 'effect': {'type': 'costReduction', 'multiplierPerLevel': 0.03}, 'requiredFeature': 'prestigeShop:tier4'}
        ]
    })

    # Copy defaults structure from cosmic-time-factory with Dr Dirt labels
    ctf_defaults = json.loads((ROOT / 'content' / 'cosmic-time-factory' / 'defaults.json').read_text())
    defaults = {**ctf_defaults}
    defaults['labels'] = {**defaults.get('labels', {}), 'primaryCurrency': 'Stone'}
    defaults['panels'] = {**defaults.get('panels', {}), 'gameSelector': {'title': 'Game Selector', 'icon': '🎮'}}
    defaults['sections'] = {**defaults.get('sections', {}), 'gameCards': {'title': 'Available Games', 'icon': '🎮'}, 'currentGame': {'title': 'Currently Playing', 'icon': '▶️'}}
    write('defaults.json', defaults)

    print('Dr Dirt content generated at', OUT)


if __name__ == '__main__':
    main()
