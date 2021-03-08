define([
    "dojo","dojo/_base/declare",
    "ebg/core/gamegui",
    "ebg/counter"
],
function (dojo, declare) {
    return declare("bgagame.lasvegasthoun", ebg.core.gamegui, new LasVegas());             
});