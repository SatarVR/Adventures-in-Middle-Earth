import ActorSheet5eCharacter from "./../../systems/dnd5e/module/actor/sheets/character.js";
import Actor5E from "./../../systems/dnd5e/module/actor/entity.js";
import {DND5E} from './../../systems/dnd5e/module/config.js';


Hooks.on('init', async function () {
	
	//DO CONFIG CHANGES
	CONFIG.DND5E.limitedUsePeriods = {
	  "sr": "DND5E.ShortRest",
	  "lr": "DND5E.LongRest",
	  "day": "DND5E.Day",
	  "charges": "DND5E.Charges",
	  "jrny": "AIME.Journey",
	  "adv": "AIME.Adventure",
	};
	CONFIG.DND5E.consumableTypes = {
	  "ammo": "DND5E.ConsumableAmmunition",
	  "potion": "DND5E.ConsumablePotion",
	  "poison": "DND5E.ConsumablePoison",
	  "food": "DND5E.ConsumableFood",
	  //"scroll": "DND5E.ConsumableScroll",
	  //"wand": "DND5E.ConsumableWand",
	  //"rod": "DND5E.ConsumableRod",
	  "trinket": "DND5E.ConsumableTrinket"
	};
	CONFIG.DND5E.currencies = {
	  "gp": "AIME.CoinsGP",
	  "sp": "AIME.CoinsSP",
	  "cp": "AIME.CoinsCP",
	};	
	CONFIG.DND5E.skills = {
	  "acr": "DND5E.SkillAcr",
	  "ani": "DND5E.SkillAni",
	  "ath": "DND5E.SkillAth",
	  //"arc": "DND5E.SkillArc",
	  "dec": "DND5E.SkillDec",
	  "his": "DND5E.SkillHis",
	  "ins": "DND5E.SkillIns",
	  "itm": "DND5E.SkillItm",
	  "inv": "DND5E.SkillInv",
	  "lor": "AIME.SkillLor",
	  "med": "DND5E.SkillMed",
	  "nat": "DND5E.SkillNat",
	  "prc": "DND5E.SkillPrc",
	  "prf": "DND5E.SkillPrf",
	  "per": "DND5E.SkillPer",
	  "rid": "AIME.SkillRid",
	  //"rel": "DND5E.SkillRel",
	  "sha": "AIME.SkillSha",
	  "slt": "DND5E.SkillSlt",
	  "ste": "DND5E.SkillSte",
	  "sur": "DND5E.SkillSur",
	  "tra": "AIME.SkillTra",
	};	
	CONFIG.DND5E.languages = {
	  "common": "AIME.LanguagesCommon",
	  "blackspeech": "AIME.LanguagesBlackSpeech",
	  "ancient": "AIME.LanguagesQuenya",
	  "sindarin": "AIME.LanguagesSindarin",
	  "dalish": "AIME.LanguagesDalish",
	  "vale": "AIME.LanguagesVale",
	  "dwarvish": "AIME.LanguagesDwarvish",
	  "woodland": "AIME.LanguagesWoodland",
	  "rohan": "AIME.LanguagesRohan"
	};	
	CONFIG.DND5E.newSkills = [
	{
		"skl": "lor",
		"ability": "int"
	},
	{
		"skl": "rid",
		"ability": "int"
	},
	{
		"skl": "sha",
		"ability" : "int"
	},
	{
		"skl": "tra",
		"ability" : "int"
	},
	];
	CONFIG.DND5E.delSkills = [ "arc", "rel", "tss", "tst"];
	// Remove PP and EP from showing up on character sheet displays since we don't use them in AiME	
	const originalGetData = ActorSheet5eCharacter.prototype.getData;
	
	ActorSheet5eCharacter.prototype.getData = function () {
		
		const data = originalGetData.call(this);		
		delete data.data.currency.pp;
		delete data.data.currency.ep;
		
		// Return data to the sheet
		return data
	};
	
	// Change Currency Conversion 12 cp = 1 sp , 20 sp = 1 gp	
	Actor5E.prototype.convertCurrency = function () {
	const curr = duplicate(this.data.data.currency);
	const convert = {
		cp: {into: "sp", each: 12},
		sp: {into: "gp", each: 20}
	};
	for ( let [c, t] of Object.entries(convert) ) {
		let change = Math.floor(curr[c] / t.each);
		curr[c] -= (change * t.each);
		curr[t.into] += change;
	}
	return this.update({"data.currency": curr});
	}
	
	
	// Test Fixes on Actor5E Prototype
	Actor5E.prototype.prepareDerivedData = function () {		
	
	console.log("ALAKAR!");
	const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.dnd5e || {};
    const bonuses = getProperty(data, "bonuses.abilities") || {};

    // Retrieve data for polymorphed actors
    let originalSaves = null;
    let originalSkills = null;
    if (this.isPolymorphed) {
      const transformOptions = this.getFlag('dnd5e', 'transformOptions');
      const original = game.actors?.get(this.getFlag('dnd5e', 'originalActor'));
      if (original) {
        if (transformOptions.mergeSaves) {
          originalSaves = original.data.data.abilities;
        }
        if (transformOptions.mergeSkills) {
          originalSkills = original.data.data.skills;
        }
      }
    }

    // Ability modifiers and saves
    const saveBonus = Number.isNumeric(bonuses.save) ? parseInt(bonuses.save) : 0;
    const checkBonus = Number.isNumeric(bonuses.check) ? parseInt(bonuses.check) : 0;
    for (let [id, abl] of Object.entries(data.abilities)) {
      abl.mod = Math.floor((abl.value - 10) / 2);
      abl.prof = (abl.proficient || 0) * data.attributes.prof;
      abl.saveBonus = saveBonus;
      abl.checkBonus = checkBonus;
      abl.save = abl.mod + abl.prof + abl.saveBonus;

      // If we merged saves when transforming, take the highest bonus here.
      if (originalSaves && abl.proficient) {
        abl.save = Math.max(abl.save, originalSaves[id].save);
      }
    }
	//FIX CUSTOM SKILL ABILITIES
	const newSkills = DND5E.newSkills;
	const delSkills = DND5E.delSkills;
	
	newSkills.forEach(e => {
		let sklName = e["skl"];
		let sklAbility = e["ability"];
		if (typeof(data.skills[sklName]) == "undefined")
		{
			console.log("Adding " + sklName);
			data.skills[sklName] = new Object();
			data.skills[sklName].ability = sklAbility;
			data.skills[sklName].value = 0;
		}
		else if (typeof(data.skills[sklName].ability) == "undefined")
		{
			data.skills[sklName].ability = [sklAbility];
		}
	});
	
	delSkills.forEach(e => {
		if (typeof(data.skills[e]) != "undefined")
			delete data.skills[e];
	});
	//END FIX BACK TO REGULAR	
    
	this._prepareSkills(actorData, bonuses, checkBonus, originalSkills);

    // Determine Initiative Modifier
    const init = data.attributes.init;
    const athlete = flags.remarkableAthlete;
    const joat = flags.jackOfAllTrades;
    init.mod = data.abilities.dex.mod;
    if ( joat ) init.prof = Math.floor(0.5 * data.attributes.prof);
    else if ( athlete ) init.prof = Math.ceil(0.5 * data.attributes.prof);
    else init.prof = 0;
    init.bonus = init.value + (flags.initiativeAlert ? 5 : 0);
    init.total = init.mod + init.prof + init.bonus;

    // Prepare spell-casting data
    data.attributes.spelldc = this.getSpellDC(data.attributes.spellcasting);
    this._computeSpellcastingProgression(this.data);
  }

});

// Hide the Spellbook - Phenomen
function i18n(key) {
    return game.i18n.localize(key);
}

Hooks.on('renderActorSheet', async function () {
    var spellbookString = i18n("DND5E.Spellbook");
    var xpath = "//a[text()='" + spellbookString + "']";    
    var matchingElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    matchingElement.style.display = "none";
});