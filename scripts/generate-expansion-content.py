#!/usr/bin/env python3
"""Generate expansion content for config JSON files."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / 'config'

SLOTS = [
    ('cape', 'Cape', '🧣'),
    ('helmet', 'Helmet', '⛑️'),
    ('amulet', 'Amulet', '🔍'),
    ('mainHand', 'Blade', '⚔️'),
    ('body', 'Plate', '🛡️'),
    ('offHand', 'Buckler', '🔰'),
    ('boots', 'Boots', '👢'),
    ('belt', 'Belt', '🎗️'),
    ('pet', 'Pet', '🐾'),
]

TIER_EFFECT = {
    'common': {'globalMultiplier': 1.04, 'clickMultiplier': 1.06, 'costReduction': 0.97},
    'rare': {'globalMultiplier': 1.08, 'clickMultiplier': 1.12, 'costReduction': 0.94},
    'epic': {'globalMultiplier': 1.14, 'clickMultiplier': 1.18, 'costReduction': 0.90},
}

EFFECT_ROTATION = ['globalMultiplier', 'clickMultiplier', 'costReduction']

GENERATOR_TIERS = {
    0: ['timeWarden', 'cosmicSailor', 'starForge'],
    1: ['nebulaHarvester', 'quantumProcessor', 'voidExtractor'],
    2: ['chronoRefinery', 'temporalEngine', 'cosmicFoundry'],
    3: ['infinityChronometer', 'voidArchitect', 'eternityForge'],
}

NEW_GENERATORS = [
    {
        'codeName': 'voidArchitect',
        'displayName': 'Void Architect',
        'description': 'Designs structures from pure void matter across dimensions.',
        'icon': '🏛️',
        'category': 'void',
        'unlockConditions': {
            'operator': 'AND',
            'conditions': [
                {'type': 'generatorOwned', 'generator': 'infinityChronometer', 'quantity': 1},
                {'type': 'resourceHeld', 'resource': 'voidMatter', 'amount': 10000}
            ]
        },
        'baseCost': 2500000000,
        'costMultiplier': 1.26,
        'costResources': [
            {'resource': 'timeShards', 'multiplier': 1},
            {'resource': 'voidMatter', 'multiplier': 100},
            {'resource': 'chronoCrystals', 'multiplier': 200}
        ],
        'produces': [
            {'resource': 'voidMatter', 'amount': 25, 'role': 'primary'},
            {'resource': 'quantumFlux', 'amount': 15, 'role': 'bonus'}
        ],
        'requiredFeature': 'generators:tier3'
    },
    {
        'codeName': 'eternityForge',
        'displayName': 'Eternity Forge',
        'description': 'Forges eternal timelines into concentrated chrono crystals.',
        'icon': '🔥',
        'category': 'temporal',
        'unlockConditions': {
            'operator': 'AND',
            'conditions': [
                {'type': 'generatorOwned', 'generator': 'voidArchitect', 'quantity': 1},
                {'type': 'ascensionTier', 'minTier': 3}
            ]
        },
        'baseCost': 10000000000,
        'costMultiplier': 1.28,
        'costResources': [
            {'resource': 'timeShards', 'multiplier': 1},
            {'resource': 'chronoCrystals', 'multiplier': 500},
            {'resource': 'voidMatter', 'multiplier': 200}
        ],
        'produces': [
            {'resource': 'chronoCrystals', 'amount': 150, 'role': 'primary'},
            {'resource': 'timeShards', 'amount': 10000, 'role': 'bonus'}
        ],
        'requiredFeature': 'generators:tier3'
    }
]


def write_json(path, data):
    path.write_text(json.dumps(data, indent=2) + '\n')
    print(f'Wrote {path.name}')


def gen_items():
    items = []
    for item in json.loads((CONFIG / 'items.json').read_text())['items']:
        if item['type'] in ('consumable', 'ingredient'):
            items.append(item)
    idx = 0
    for slot, label, icon in SLOTS:
        for tier in ('common', 'rare', 'epic'):
            effect_type = EFFECT_ROTATION[idx % len(EFFECT_ROTATION)]
            idx += 1
            mult = TIER_EFFECT[tier][effect_type]
            code = f'{slot}{tier.capitalize()}'
            items.append({
                'codeName': code,
                'displayName': f'{tier.capitalize()} {label}',
                'description': f'{tier.capitalize()} {label.lower()} gear for the {slot} slot.',
                'icon': icon,
                'type': 'equipable',
                'slot': slot,
                'rarity': tier,
                'stackable': True,
                'dropTier': tier,
                'effect': {'type': effect_type, 'multiplier': mult}
            })
    extras = [
        ('fluxDrink', 'Flux Drink', '🥤', 'globalMultiplier', 1.35, 45),
        ('tapSerum', 'Tap Serum', '💉', 'clickMultiplier', 2.5, 20),
        ('costCache', 'Cost Cache', '📦', 'costReduction', 0.85, 60),
        ('stellarRation', 'Stellar Ration', '🍱', 'globalMultiplier', 1.2, 90),
        ('voidCapsule', 'Void Capsule', '💊', 'clickMultiplier', 1.8, 30),
        ('chronoTea', 'Chrono Tea', '🍵', 'globalMultiplier', 1.15, 120),
        ('quantumShot', 'Quantum Shot', '⚗️', 'clickMultiplier', 3, 15),
        ('nebulaBar', 'Nebula Bar', '🍫', 'globalMultiplier', 1.25, 75),
        ('essenceVial', 'Essence Vial', '🧪', 'costReduction', 0.8, 45),
        ('infinityDrop', 'Infinity Drop', '💧', 'globalMultiplier', 1.5, 30),
    ]
    for code, name, icon, etype, mult, dur in extras:
        items.append({
            'codeName': code, 'displayName': name,
            'description': f'Consumable boost: {etype}.',
            'icon': icon, 'type': 'consumable', 'actionBarEligible': True,
            'effect': {'type': etype, 'multiplier': mult, 'durationSeconds': dur}
        })
    write_json(CONFIG / 'items.json', {'items': items})


def gen_characters():
    existing = json.loads((CONFIG / 'characters.json').read_text())['characters']
    new_chars = [
        {
            'codeName': 'quantumSmith', 'displayName': 'Quantum Smith', 'icon': '🔨',
            'description': 'Forges probability into production.',
            'unlockConditions': {'operator': 'AND', 'conditions': [
                {'type': 'ascensionTier', 'minTier': 1},
                {'type': 'generatorOwned', 'generator': 'quantumProcessor', 'quantity': 1}
            ]},
            'baseStats': {'categoryMultiplier': {'category': 'quantum', 'multiplier': 1.12}},
            'activeSkill': {'codeName': 'quantumForge', 'displayName': 'Quantum Forge', 'icon': '⚛️',
                            'cooldownSeconds': 40, 'effect': {'type': 'globalMultiplier', 'multiplier': 2.2, 'durationSeconds': 12}}
        },
        {
            'codeName': 'voidScribe', 'displayName': 'Void Scribe', 'icon': '📜',
            'description': 'Records losses between dimensions as power.',
            'unlockConditions': {'operator': 'AND', 'conditions': [
                {'type': 'lifetimePrestiges', 'min': 3},
                {'type': 'resourceHeld', 'resource': 'voidMatter', 'amount': 500}
            ]},
            'baseStats': {'globalMultiplier': 1.08},
            'activeSkill': {'codeName': 'voidScript', 'displayName': 'Void Script', 'icon': '🕳️',
                            'cooldownSeconds': 55, 'effect': {'type': 'costReduction', 'multiplier': 0.7, 'durationSeconds': 20}}
        },
        {
            'codeName': 'chronoKnight', 'displayName': 'Chrono Knight', 'icon': '🗡️',
            'description': 'A warrior bound to frozen seconds.',
            'unlockConditions': {'operator': 'AND', 'conditions': [
                {'type': 'ascensionTier', 'minTier': 2},
                {'type': 'generatorOwned', 'generator': 'temporalEngine', 'quantity': 3}
            ]},
            'baseStats': {'clickMultiplier': 1.25},
            'activeSkill': {'codeName': 'timeSlash', 'displayName': 'Time Slash', 'icon': '⚔️',
                            'cooldownSeconds': 35, 'effect': {'type': 'clickMultiplier', 'multiplier': 4, 'durationSeconds': 10}}
        },
        {
            'codeName': 'stellarOracle', 'displayName': 'Stellar Oracle', 'icon': '🔮',
            'description': 'Reads futures in starlight patterns.',
            'unlockConditions': {'operator': 'AND', 'conditions': [
                {'type': 'achievement', 'achievement': 'firstPrestige'},
                {'type': 'generatorOwned', 'generator': 'starForge', 'quantity': 10}
            ]},
            'baseStats': {'categoryMultiplier': {'category': 'stellar', 'multiplier': 1.2}},
            'activeSkill': {'codeName': 'starProphecy', 'displayName': 'Star Prophecy', 'icon': '✨',
                            'cooldownSeconds': 50, 'effect': {'type': 'globalMultiplier', 'multiplier': 2.5, 'durationSeconds': 15}}
        },
        {
            'codeName': 'infinityWarden', 'displayName': 'Infinity Warden', 'icon': '♾️',
            'description': 'Guards the loop where all timelines converge.',
            'unlockConditions': {'operator': 'AND', 'conditions': [
                {'type': 'ascensionTier', 'minTier': 3},
                {'type': 'lifetimePrestiges', 'min': 10}
            ]},
            'baseStats': {'globalMultiplier': 1.15, 'clickMultiplier': 1.1},
            'activeSkill': {'codeName': 'infinityGuard', 'displayName': 'Infinity Guard', 'icon': '🛡️',
                            'cooldownSeconds': 90, 'effect': {'type': 'globalMultiplier', 'multiplier': 3, 'durationSeconds': 8}}
        },
    ]
    write_json(CONFIG / 'characters.json', {'characters': existing + new_chars})


def gen_artifacts():
    gens = {g['codeName']: g for g in json.loads((CONFIG / 'generators.json').read_text())['generators']}
    existing = json.loads((CONFIG / 'artifacts.json').read_text())['artifacts']
    templates = [
        ('fluxCoil', 'Flux Coil', '⚡', 'uncommon', 'globalMultiplier', 1.06, 'quantumProcessor', 1),
        ('nebulaShard', 'Nebula Shard', '🌠', 'common', 'categoryMultiplier', 1.15, 'nebulaHarvester', 0),
        ('voidSigil', 'Void Sigil', '🜂', 'rare', 'costReduction', 0.92, 'voidExtractor', 1),
        ('chronoDial', 'Chrono Dial', '🕰️', 'rare', 'globalMultiplier', 1.12, 'chronoRefinery', 1),
        ('temporalAnchor', 'Temporal Anchor', '⚓', 'epic', 'globalMultiplier', 1.18, 'temporalEngine', 2),
        ('cosmicEmber', 'Cosmic Ember', '🔥', 'uncommon', 'categoryMultiplier', 1.2, 'cosmicFoundry', 2),
        ('quantumEcho', 'Quantum Echo', '📡', 'rare', 'clickMultiplier', 1.3, 'quantumProcessor', 1),
        ('stellarCore', 'Stellar Core', '☀️', 'epic', 'globalMultiplier', 1.22, 'starForge', 0),
        ('voidMirror', 'Void Mirror', '🪞', 'legendary', 'clickMultiplier', 1.5, 'voidExtractor', 2),
        ('infinityLoop', 'Infinity Loop', '🔗', 'legendary', 'globalMultiplier', 1.25, 'infinityChronometer', 3),
        ('timeCapsule', 'Time Capsule', '💊', 'common', 'globalMultiplier', 1.04, 'timeWarden', 0),
        ('sailorChart', 'Sailor Chart', '🗺️', 'common', 'categoryMultiplier', 1.1, 'cosmicSailor', 0),
        ('forgeHammer', 'Forge Hammer', '🔨', 'uncommon', 'globalMultiplier', 1.08, 'starForge', 1),
        ('harvesterLens', 'Harvester Lens', '🔭', 'uncommon', 'globalMultiplier', 1.1, 'nebulaHarvester', 1),
        ('processorChip', 'Processor Chip', '💾', 'rare', 'categoryMultiplier', 1.3, 'quantumProcessor', 2),
        ('extractorFang', 'Extractor Fang', '🦷', 'rare', 'clickMultiplier', 1.25, 'voidExtractor', 2),
        ('refineryCoil', 'Refinery Coil', '🌀', 'epic', 'globalMultiplier', 1.16, 'chronoRefinery', 2),
        ('engineCog', 'Engine Cog', '⚙️', 'epic', 'globalMultiplier', 1.2, 'temporalEngine', 2),
        ('foundryBrand', 'Foundry Brand', '🏷️', 'legendary', 'categoryMultiplier', 1.35, 'cosmicFoundry', 3),
        ('chronometerHand', 'Chronometer Hand', '🖐️', 'legendary', 'globalMultiplier', 1.3, 'infinityChronometer', 3),
    ]
    arts = list(existing)
    for code, name, icon, rarity, etype, mult, gen, tier in templates:
        effect = {'type': etype, 'multiplier': mult}
        if etype == 'categoryMultiplier':
            effect['category'] = gens.get(gen, {}).get('category', 'stellar')
        arts.append({
            'codeName': code, 'displayName': name,
            'description': f'Permanent {etype} from {gen}.',
            'icon': icon, 'rarity': rarity, 'effect': effect,
            'dropRequirements': {'generator': gen, 'minAscensionTier': tier}
        })
    write_json(CONFIG / 'artifacts.json', {'artifacts': arts})


def gen_achievements():
    existing = json.loads((CONFIG / 'achievements.json').read_text())['achievements']
    for ach in existing:
        r = ach.get('reward', {})
        if r.get('type') in ('resourceBonus', 'titleUnlock'):
            ach['reward'] = {'type': 'modifierUnlock', 'effect': {'type': 'globalMultiplier', 'multiplier': 1.03}}

    new_defs = [
        ('tap500', 'Tap Apprentice', 'Tap 500 times.', 'totalTaps', {'amount': 500}, 'clickMultiplier', 1.05),
        ('tap5000', 'Tap Expert', 'Tap 5,000 times.', 'totalTaps', {'amount': 5000}, 'clickMultiplier', 1.08),
        ('own25gen', 'Industrialist', 'Own 25 generators total.', 'generatorCount', {'amount': 25}, 'globalMultiplier', 1.04),
        ('own100gen', 'Megafactory', 'Own 100 generators total.', 'generatorCount', {'amount': 100}, 'globalMultiplier', 1.08),
        ('prestige3', 'Triple Reset', 'Reach 3 lifetime prestiges.', 'lifetimePrestiges', {'amount': 3}, 'globalMultiplier', 1.05),
        ('prestige10', 'Decade Reset', 'Reach 10 lifetime prestiges.', 'lifetimePrestiges', {'amount': 10}, 'globalMultiplier', 1.1),
        ('ascensionTier2', 'Transcendent', 'Reach ascension tier 2.', 'ascensionTier', {'minTier': 2}, 'globalMultiplier', 1.06),
        ('ascensionTier3', 'Cosmic Being', 'Reach ascension tier 3.', 'ascensionTier', {'minTier': 3}, 'globalMultiplier', 1.12),
        ('artifact10', 'Vault Keeper', 'Collect 10 artifacts.', 'artifactCount', {'amount': 10}, 'globalMultiplier', 1.07),
        ('artifact20', 'Master Curator', 'Collect 20 artifacts.', 'artifactCount', {'amount': 20}, 'globalMultiplier', 1.12),
        ('rate10k', 'Velocity', 'Reach 10k primary currency/s.', 'primaryCurrencyRateReached', {'amount': 10000}, 'globalMultiplier', 1.05),
        ('rate1m', 'Hypervelocity', 'Reach 1M primary currency/s.', 'primaryCurrencyRateReached', {'amount': 1000000}, 'globalMultiplier', 1.1),
        ('ownSailor5', 'Fleet Captain', 'Own 5 Cosmic Sailors.', 'generatorOwned', {'generator': 'cosmicSailor', 'amount': 5}, 'globalMultiplier', 1.03),
        ('ownQuantum1', 'Quantum Initiate', 'Own a Quantum Processor.', 'generatorOwned', {'generator': 'quantumProcessor', 'amount': 1}, 'categoryMultiplier', 1.1),
        ('ownInfinity1', 'Infinity Touch', 'Own Infinity Chronometer.', 'generatorOwned', {'generator': 'infinityChronometer', 'amount': 1}, 'globalMultiplier', 1.15),
        ('earnCosmic', 'Cosmic Hoard', 'Earn 1M cosmic energy total.', 'resourceEarned', {'resource': 'cosmicEnergy', 'amount': 1000000}, 'globalMultiplier', 1.04),
        ('earnVoid', 'Void Hoard', 'Earn 100k void matter total.', 'resourceEarned', {'resource': 'voidMatter', 'amount': 100000}, 'globalMultiplier', 1.06),
        ('prestigeTier5', 'Tier Veteran', '5 prestiges this tier.', 'prestigeCount', {'amount': 5}, 'costReduction', 0.98),
        ('chars3', 'Team Builder', 'Unlock 3 characters.', 'charactersUnlocked', {'amount': 3}, 'globalMultiplier', 1.04),
        ('chars8', 'Full Roster', 'Unlock all 8 characters.', 'charactersUnlocked', {'amount': 8}, 'globalMultiplier', 1.1),
        ('equipFull', 'Fully Loaded', 'Equip 9 slots on one character.', 'equipmentSlotsFilled', {'amount': 9}, 'clickMultiplier', 1.06),
        ('item10', 'Pack Rat', 'Hold 10 of any item.', 'itemHeld', {'amount': 10}, 'globalMultiplier', 1.03),
        ('upgrade20', 'Tinkerer', 'Buy 20 upgrade levels total.', 'upgradeLevels', {'amount': 20}, 'costReduction', 0.97),
        ('upgrade100', 'Master Tinkerer', 'Buy 100 upgrade levels total.', 'upgradeLevels', {'amount': 100}, 'costReduction', 0.94),
        ('event10', 'Eventful', 'Experience 10 random events.', 'eventsSeen', {'amount': 10}, 'globalMultiplier', 1.03),
        ('offline1h', 'Away Strong', 'Claim 1 hour offline progress.', 'offlineSeconds', {'amount': 3600}, 'globalMultiplier', 1.05),
        ('shop5', 'Investor', 'Buy 5 total prestige shop levels.', 'prestigeShopLevels', {'amount': 5}, 'globalMultiplier', 1.04),
        ('shop25', 'Patron', 'Buy 25 total prestige shop levels.', 'prestigeShopLevels', {'amount': 25}, 'globalMultiplier', 1.08),
        ('tier0Master', 'Mortal Master', 'Own 10+ of each tier-0 generator.', 'generatorsOwnedTier', {'tier': 0, 'amount': 10}, 'globalMultiplier', 1.06),
        ('tier3Master', 'Cosmic Master', 'Own all tier-3 generators.', 'generatorsOwnedTier', {'tier': 3, 'amount': 1}, 'globalMultiplier', 1.15),
    ]
    icons = ['🏅', '⭐', '🎯', '🔥', '💫', '🌟', '🏆', '🎖️', '✨', '💎']
    new = []
    for i, (code, name, desc, rtype, rparams, etype, mult) in enumerate(new_defs):
        req = {'type': rtype, **rparams}
        effect = {'type': etype, 'multiplier': mult}
        if etype == 'categoryMultiplier':
            effect['category'] = 'quantum'
        new.append({
            'codeName': code, 'displayName': name, 'description': desc,
            'icon': icons[i % len(icons)],
            'requirement': req,
            'reward': {'type': 'modifierUnlock', 'effect': effect}
        })
    write_json(CONFIG / 'achievements.json', {'achievements': existing + new})


def gen_generators():
    data = json.loads((CONFIG / 'generators.json').read_text())
    gens = {g['codeName']: g for g in data['generators']}
    for tier, codes in GENERATOR_TIERS.items():
        feat = f'generators:tier{tier}'
        for code in codes:
            if code not in gens and code in ('voidArchitect', 'eternityForge'):
                continue
            if code in gens:
                gens[code]['requiredFeature'] = feat if tier > 0 else None
                if tier == 0 and 'requiredFeature' in gens[code]:
                    del gens[code]['requiredFeature']
    for ng in NEW_GENERATORS:
        gens[ng['codeName']] = ng
    # fix infinity - remove systems:allGenerators
    if 'infinityChronometer' in gens:
        gens['infinityChronometer']['requiredFeature'] = 'generators:tier3'
    ordered = []
    for tier in range(4):
        for code in GENERATOR_TIERS[tier]:
            if code in gens:
                ordered.append(gens[code])
    write_json(CONFIG / 'generators.json', {'generators': ordered})


def gen_prestige():
    data = json.loads((CONFIG / 'prestige.json').read_text())
    data['prestigeMinimumBase'] = {
        'operator': 'AND',
        'conditions': [
            {'type': 'resourceHeld', 'resource': 'timeShards', 'amount': 1000},
            {'type': 'resourceHeld', 'resource': 'cosmicEnergy', 'amount': 500},
            {'type': 'resourceHeld', 'resource': 'stardust', 'amount': 100}
        ]
    }
    data['prestigeMinimumTierResources'] = {
        '1': [{'resource': 'quantumFlux', 'amount': 50}],
        '2': [{'resource': 'voidMatter', 'amount': 200}],
        '3': [{'resource': 'chronoCrystals', 'amount': 100}]
    }
    data['prestigeMinimumScalePerPrestige'] = 0.2
    data['prestigeCurrency']['milestoneExponent'] = 2
    data['prestigeCurrency']['rulesExplanation'] = (
        'Prestige Shards are earned from weighted run earnings (ascension-available resources only). '
        'Each shard requires exponentially more weighted value; requirements scale with lifetime prestiges.'
    )
    data['onPrestige']['resetPrestigeShopAllocation'] = True
    bonuses = [
        {'codeName': 'globalBoost', 'displayName': 'Cosmic Resonance', 'description': '+5% primary currency per level', 'icon': '🌟', 'cost': 1, 'maxLevel': 25, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.05}, 'requiredFeature': 'prestigeShop:tier0'},
        {'codeName': 'clickPower', 'displayName': 'Tap Amplifier', 'description': '+10% click power per level', 'icon': '👆', 'cost': 2, 'maxLevel': 15, 'effect': {'type': 'clickMultiplier', 'multiplierPerLevel': 0.10}, 'requiredFeature': 'prestigeShop:tier0'},
        {'codeName': 'offlineBoost', 'displayName': 'Dream Harvest', 'description': '+3% offline efficiency per level', 'icon': '🌙', 'cost': 2, 'maxLevel': 10, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.03}, 'requiredFeature': 'prestigeShop:tier0'},
        {'codeName': 'stellarResonance', 'displayName': 'Stellar Resonance', 'description': '+8% stellar generators per level', 'icon': '⭐', 'cost': 3, 'maxLevel': 12, 'effect': {'type': 'categoryMultiplier', 'category': 'stellar', 'multiplierPerLevel': 0.08}, 'requiredFeature': 'prestigeShop:tier1'},
        {'codeName': 'quantumFocus', 'displayName': 'Quantum Focus', 'description': '+8% quantum generators per level', 'icon': '⚛️', 'cost': 3, 'maxLevel': 12, 'effect': {'type': 'categoryMultiplier', 'category': 'quantum', 'multiplierPerLevel': 0.08}, 'requiredFeature': 'prestigeShop:tier1'},
        {'codeName': 'startingBonus', 'displayName': 'Head Start', 'description': '+5 starting time shards per level after prestige', 'icon': '🚀', 'cost': 2, 'maxLevel': 10, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.02}, 'requiredFeature': 'prestigeShop:tier1'},
        {'codeName': 'costEfficiency', 'displayName': 'Efficiency Matrix', 'description': '-2% costs per level', 'icon': '📉', 'cost': 3, 'maxLevel': 10, 'effect': {'type': 'costReduction', 'multiplierPerLevel': 0.02}, 'requiredFeature': 'prestigeShop:tier2'},
        {'codeName': 'voidDiscount', 'displayName': 'Void Bargain', 'description': '+6% void generator output per level', 'icon': '🕳️', 'cost': 4, 'maxLevel': 10, 'effect': {'type': 'categoryMultiplier', 'category': 'void', 'multiplierPerLevel': 0.06}, 'requiredFeature': 'prestigeShop:tier2'},
        {'codeName': 'upgradeBoost', 'displayName': 'Upgrade Catalyst', 'description': '+4% global production per level', 'icon': '🔧', 'cost': 4, 'maxLevel': 15, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.04}, 'requiredFeature': 'prestigeShop:tier2'},
        {'codeName': 'infinityAmp', 'displayName': 'Infinity Amplifier', 'description': '+6% global production per level', 'icon': '♾️', 'cost': 5, 'maxLevel': 20, 'effect': {'type': 'globalMultiplier', 'multiplierPerLevel': 0.06}, 'requiredFeature': 'prestigeShop:tier3'},
        {'codeName': 'ascensionMemory', 'displayName': 'Ascension Memory', 'description': '+5% click power per level', 'icon': '🧠', 'cost': 5, 'maxLevel': 15, 'effect': {'type': 'clickMultiplier', 'multiplierPerLevel': 0.05}, 'requiredFeature': 'prestigeShop:tier3'},
        {'codeName': 'masteryCore', 'displayName': 'Mastery Core', 'description': '-3% costs per level', 'icon': '💎', 'cost': 6, 'maxLevel': 10, 'effect': {'type': 'costReduction', 'multiplierPerLevel': 0.03}, 'requiredFeature': 'prestigeShop:tier3'},
    ]
    data['prestigeBonuses'] = bonuses
    write_json(CONFIG / 'prestige.json', data)


def gen_ascension():
    data = json.loads((CONFIG / 'ascension.json').read_text())
    for tier_def in data['ascensionTiers']:
        t = tier_def['tier']
        feats = tier_def.setdefault('unlockedFeatures', [])
        for f in [f'generators:tier{t}', f'prestigeShop:tier{t}']:
            if f not in feats:
                feats.append(f)
        if t == 0:
            for rm in ['generators:quantumProcessor', 'systems:allGenerators']:
                if rm in feats:
                    feats.remove(rm)
    write_json(CONFIG / 'ascension.json', data)


def gen_drops():
    equip_entries = []
    for slot, _, _ in SLOTS:
        for tier, weight in [('common', 60), ('rare', 30), ('epic', 10)]:
            code = f'{slot}{tier.capitalize()}'
            equip_entries.append({'item': code, 'weight': weight, 'quantity': [1, 1], 'dropTier': tier})

    consumables = [
        'energyCell', 'rareCrystal', 'fluxDrink', 'tapSerum', 'costCache',
        'stellarRation', 'voidCapsule', 'chronoTea', 'quantumShot', 'nebulaBar',
        'essenceVial', 'infinityDrop'
    ]
    tick_consumables = [{'item': c, 'weight': 10, 'quantity': [1, 1]} for c in consumables]

    artifact_entries = []
    for art in json.loads((CONFIG / 'artifacts.json').read_text())['artifacts']:
        w = {'common': 40, 'uncommon': 30, 'rare': 20, 'epic': 12, 'legendary': 5}.get(art.get('rarity', 'common'), 20)
        entry = {'artifact': art['codeName'], 'weight': w}
        if art.get('dropRequirements'):
            entry['dropRequirements'] = art['dropRequirements']
        artifact_entries.append(entry)

    write_json(CONFIG / 'drops.json', {
        'dropTables': [
            {
                'codeName': 'passiveTick',
                'trigger': 'tick',
                'chancePerSecond': 0.08,
                'entries': tick_consumables
            },
            {
                'codeName': 'onClick',
                'trigger': 'click',
                'chance': 0.025,
                'entries': tick_consumables + [{'item': 'voidShard', 'weight': 5, 'quantity': [1, 1]}]
            },
            {
                'codeName': 'equipmentDrop',
                'trigger': 'tick',
                'chancePerSecond': 0.012,
                'dynamicTierWeights': True,
                'entries': equip_entries
            },
            {
                'codeName': 'artifactDrop',
                'trigger': 'tick',
                'chancePerSecond': 0.0008,
                'entries': artifact_entries
            }
        ],
        'equipmentDropModifiers': {
            'tierWeightsByAscension': {
                '0': {'common': 0.75, 'rare': 0.22, 'epic': 0.03},
                '1': {'common': 0.55, 'rare': 0.35, 'epic': 0.10},
                '2': {'common': 0.40, 'rare': 0.42, 'epic': 0.18},
                '3': {'common': 0.25, 'rare': 0.45, 'epic': 0.30}
            },
            'quantityBonusPerGenerator': 0.002,
            'categoryBoostPerOwned': 0.05
        }
    })


def main():
    gen_items()
    gen_characters()
    gen_generators()
    gen_artifacts()
    gen_achievements()
    gen_prestige()
    gen_ascension()
    gen_drops()
    print('Expansion content generation complete.')


if __name__ == '__main__':
    main()
