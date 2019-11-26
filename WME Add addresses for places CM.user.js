// ==UserScript==
// @name         WME Add addresses for places CM
// @version      0.25.25
// @description  Добавление альтернативных названий (адресов)
// @author       ixxvivxxi, Vinkoy, Axel_Miami
// @include      https://*waze.com/*editor*
// @exclude      https://*waze.com/*user/editor*
// @grant        none
// @namespace    http://cities.ster.by/WMEAddAddressesForPlaces.js
// ==/UserScript==

function altAddress_bootstrap()
{
//    // fix `require` issue
    var WMEAPI={};for(WMEAPI.scripts=document.getElementsByTagName("script"),WMEAPI.url=null,i=0;i<WMEAPI.scripts.length;i++)if(WMEAPI.scripts[i].src.indexOf("//editor-assets.waze.com/production/js/")!=-1){WMEAPI.url=WMEAPI.scripts[i].src;break}if(null==WMEAPI.url)throw new Error("WME Hack: can't detect WME main JS");WMEAPI.require=function(a){return WMEAPI.require.define.modules.hasOwnProperty(a)?WMEAPI.require.define.modules[a]:(console.error("Require failed on "+a,WMEAPI.require.define.modules),null)},WMEAPI.require.define=function(a){0==WMEAPI.require.define.hasOwnProperty("modules")&&(WMEAPI.require.define.modules={});for(var b in a)WMEAPI.require.define.modules[b]=a[b]},WMEAPI.tmp=window.webpackJsonp,WMEAPI.t=function(a){if(WMEAPI.s[a])return WMEAPI.s[a].exports;var b=WMEAPI.s[a]={exports:{},id:a,loaded:!1};return WMEAPI.e[a].call(b.exports,b,b.exports,WMEAPI.t),b.loaded=!0,b.exports},WMEAPI.e=[],window.webpackJsonp=function(a,b){for(var d,e,c={},f=0,g=[];f<a.length;f++)e=a[f],WMEAPI.r[e]&&g.push.apply(g,WMEAPI.r[e]),WMEAPI.r[e]=0;var i,j,h=0;for(d in b)WMEAPI.e[d]=b[d],j=b[d].toString(),i=j.match(/CLASS_NAME:\"([^\"]*)\"/),i?c[i[1].replace(/\./g,"/").replace(/^W\//,"Waze/")]={index:d,func:WMEAPI.e[d]}:(c["Waze/Unknown/"+h]={index:d,func:WMEAPI.e[d]},h++);for(;g.length;)g.shift().call(null,WMEAPI.t);WMEAPI.s[0]=0;var l,k={};h=0;for(d in b)if(j=b[d].toString(),i=j.match(/CLASS_NAME:\"([^\"]*)\"/))k={},l=i[1].replace(/\./g,"/").replace(/^W\//,"Waze/"),k[l]=WMEAPI.t(c[l].index),WMEAPI.require.define(k);else{var m=j.match(/SEGMENT:"segment",/);m&&(k={},l="Waze/Model/ObjectType",k[l]=WMEAPI.t(c["Waze/Unknown/"+h].index),WMEAPI.require.define(k)),h++}window.webpackJsonp=WMEAPI.tmp,window.require=WMEAPI.require},WMEAPI.s={},WMEAPI.r={0:0},WMEAPI.WMEHACK_Injected_script=document.createElement("script"),WMEAPI.WMEHACK_Injected_script.setAttribute("type","application/javascript"),WMEAPI.WMEHACK_Injected_script.src=WMEAPI.url,document.body.appendChild(WMEAPI.WMEHACK_Injected_script);

    var oWaze=Window.Waze;
    var oI18n=Window.I18n;

    if (typeof unsafeWindow !== "undefined")
    {
        oWaze=unsafeWindow.Waze;
        oI18n=unsafeWindow.I18n;
    }

    if (typeof oWaze === "undefined")
    {
        setTimeout(altAddress_bootstrap, 500);
        return;
    }
    if (typeof oWaze.map === "undefined")
    {
        setTimeout(altAddress_bootstrap, 500);
        return;
    }
    if (typeof oWaze.selectionManager === "undefined")
    {
        setTimeout(altAddress_bootstrap, 500);
        return;
    }
    if (typeof oI18n === "undefined")
    {
        setTimeout(altAddress_bootstrap, 500);
        return;
    }
    if (typeof oI18n.translations === "undefined")
    {
        setTimeout(altAddress_bootstrap, 500);
        return;
    }

    /* begin running the code! */
    setTimeout(startAltAddress, 999);
}

function startAltAddress()
{
    console.log("WME-ADR: INITIALIZATION");
    var POIaddresses = [];
    var POIs = [];
    var ncaPolygon = new OpenLayers.Geometry();
    var ncaJSON;

    W.selectionManager.events.register("selectionchanged", null, showTitle);

    $('#sidebar').on('click', '#addPOIs', function(event) {
        event.preventDefault();
        addPOIs();
    });
    $('#sidebar').on('click', '#addPOIs2', function(event){
        event.preventDefault();
        ncaJSON = $.parseJSON($('#sidebar').find('#ncajson').val());

        ncaPolygon = W.selectionManager.getSelectedFeatures()[0].geometry;
        W.model.actionManager.undo();
        W.model.actionManager.undo();
        getPOIs();
        setAddressFromJSON(ncaJSON, "КС");
        setAddressFromJSON(ncaJSON, "ЗУ");
    });

    W.model.events.register('mergeend', null, getPOIs);
    W.model.events.register('zoomend', null, getPOIs);
    W.model.events.register('moveend', null, getPOIs);

    var wazeActionAddLandmark = require("Waze/Action/AddLandmark");
    var wazeActionUpdateObject = require("Waze/Action/UpdateObject");
    var wazeActionDeleteObject = require("Waze/Action/DeleteObject");
    var wazeActionUpdateFeatureAddress = require("Waze/Action/UpdateFeatureAddress");
    var wazefeatureVectorLandmark = require("Waze/Feature/Vector/Landmark");
    var address;
    var selectStreetName = "";

    addTab();
    localDataManager();

    var WME_ADR_debug = document.getElementById('_debugScript').checked;

    document.getElementById('_debugScript').onclick = function(){
        WME_ADR_debug = document.getElementById('_debugScript').checked;
        WME_ADR_debug ? console.log("WME-ADR: debug ON") : console.log("WME-ADR: debug OFF");
    };

    function addTab()
    {
        if(!document.getElementById(CreateID()))
        {
            var btnSection = document.createElement('div');
            btnSection.id = CreateID();
            var userTabs = document.getElementById('user-info');
            if (!(userTabs && getElementsByClassName('nav-tabs', userTabs)))
                return;

            var navTabs = getElementsByClassName('nav-tabs', userTabs)[0];
            if (typeof navTabs !== "undefined")
            {
                if (!getElementsByClassName('tab-content', userTabs))
                    return;

                var tabContent = getElementsByClassName('tab-content', userTabs)[0];

                if (typeof tabContent !== "undefined")
                {
                    newtab = document.createElement('li');
                    newtab.innerHTML = '<a href="#' + CreateID() + '" data-toggle="tab"><span class="fa fa-bomb"></span></a>';
                    navTabs.appendChild(newtab);

                    btnSection.innerHTML = '<div class="form-group">'+
                        '<h4><span class="fa fa-bomb">&nbsp;Add addresses for places CM&nbsp;<sup>' + GM_info.script.version + '</sup>&nbsp;</h4>' +
                        '</br>' +
                        '<div title="Создавать ПТ"><input type="checkbox" id="_createRH" /><b>&nbsp;Создавать ПТ</b></div>' +
                        '<div title="Создавать POI-точки"><input type="checkbox" id="_createPOI" /><b>&nbsp;Создавать POI-точки</b></div>' +
                        '<div title="Обновлять контуры"><input type="checkbox" id="_updatePlaces" /><b>&nbsp;Обновлять контуры</b></div>' +
                        '<div title="Обновлять блокировку"><input type="checkbox" id="_updateLock" /><b>&nbsp;Обновлять блокировку</b></div>' +
                        '<div title="Выравнивать POI и ПТ по ХН"><input type="checkbox" id="_allignToHN" /><b>&nbsp;Выравнивать по ХН</b></div>' +
                        '<div title="Уровень блокировки"><b>Уровень блокировки&nbsp;</b>' +
                        '<select id="_lockLevel" style="padding-left: 30px;margin-left: 10px;" ><option value="0">1</option><option value="1">2</option><option value="2">3</option><option value="3">4</option><option value="4">5</option></select></div>' +
                        '</br>' +
                        '<div title="Debug script"><input type="checkbox" id="_debugScript" /><i>&nbsp;Debug script</i></div>' +
                        '</div>';

                    btnSection.className = "tab-pane";
                    tabContent.appendChild(btnSection);
                    console.log("WME-ADR: addTab. tab is created");
                }
                else
                {
                    btnSection.id='';
                    console.log("WME-ADR: addTab. 'tab-content' undefined");
                }
            }
            else
            {
                btnSection.id='';
                console.log("WME-ADR: addTab. 'nav-tabs' undefined");
            }
        }
        else
        {
            console.log("WME-ADR: addTab. Tab has already created");
        }
    }
    /**/

    function CreateID()
    {
        return 'WME-Bomb';
    }

    function localDataManager()
    {
        // restore saved settings
        if (localStorage.WMEbomb)
        {
            console.log("WME-ADR: LDM. restore saved settings");
            options = JSON.parse(localStorage.WMEbomb);
            if(options[1] !== undefined)
                document.getElementById('_lockLevel').selectedIndex	= options[1];
            else
                document.getElementById('_lockLevel').selectedIndex = 0;
            document.getElementById('_createRH').checked            = options[2];
            document.getElementById('_createPOI').checked           = options[3];
            document.getElementById('_updatePlaces').checked        = options[4];
            document.getElementById('_updateLock').checked          = options[5];
            document.getElementById('_allignToHN').checked          = options[6];
            document.getElementById('_debugScript').checked         = options[7];
            console.log("WME-ADR: LDM. restored parameters from localStorage", options);
        }
        else
        {
            document.getElementById('_lockLevel').selectedIndex = 0;
            document.getElementById('_createRH').checked        = true;
            document.getElementById('_createPOI').checked       = true;
            document.getElementById('_updatePlaces').checked    = true;
            document.getElementById('_updateLock').checked      = true;
            document.getElementById('_allignToHN').checked      = true;
            document.getElementById('_debugScript').checked     = false;
            console.log("WME-ADR: LDM. set default parameters");
        }
        // overload the WME exit function
        wme_saveBombOptions = function()
        {
            if (localStorage)
            {
                var options = [];

                // preserve previous options which may get lost after logout
                if (localStorage.WMEbomb)
                    options = JSON.parse(localStorage.WMEbomb);

                options[1] = document.getElementById('_lockLevel').selectedIndex;
                options[2] = document.getElementById('_createRH').checked;
                options[3] = document.getElementById('_createPOI').checked;
                options[4] = document.getElementById('_updatePlaces').checked;
                options[5] = document.getElementById('_updateLock').checked;
                options[6] = document.getElementById('_allignToHN').checked;
                options[7] = document.getElementById('_debugScript').checked;

                localStorage.WMEbomb = JSON.stringify(options);
                console.log("WME-ADR: LDM. save parameters");
            }
        };
        window.addEventListener("beforeunload", wme_saveBombOptions, false);
    }

    function getPOIs()
    {
        POIs = [];
        for(var idVenue in W.model.venues.objects)
        {
            var venue = W.model.venues.objects[idVenue];
            var venueAddressDetails = venue.getAddress();

            if(selectStreetName === null || venueAddressDetails === null || venueAddressDetails.
                    attributes.isEmpty === true) {continue;}

            if(venueAddressDetails.attributes.street.name == selectStreetName && selectStreetName !== "")
            {
                $("g[id^='W.Layer.FeatureLayer']").find("svg[id='" + venue.geometry.id + "']").attr('stroke', 'yellow');
                $("g[id^='W.Layer.FeatureLayer']").find("circle[id='" + venue.geometry.id + "']").attr('stroke', 'yellow');
                $("g[id^='W.Layer.FeatureLayer']").find("path[id='" + venue.geometry.id + "']").attr('stroke', 'yellow');
            }

            var inPois = false;

            var category = venue.getMainCategory();
            if(category == "NATURAL_FEATURES" || category == "OUTDOORS")
            {
                inPois = true;
            }
            for(var ir = 0; ir < POIs.length; ir++)
            {
                if(POIs[ir].attributes.id.toString().indexOf("-") != -1) {continue;}
                if(POIs[ir].attributes.id === idVenue)
                {
                    POIs[ir] = venue;
                    inPois = true;
                    if(WME_ADR_debug) console.log("WME-ADR: getPOIs(); in POI list", venue);
                }
            }
            if(!inPois)
            {
                if(WME_ADR_debug) console.log("WME-ADR: getPOIs(); added to POI list ("+venueAddressDetails.attributes.street.name+", "+venueAddressDetails.attributes.houseNumber+")", venue);
                POIs.push(venue);
            }
        }
        if(WME_ADR_debug) console.log("WME-ADR: getPOIs(); POIs("+POIs.length+")", POIs);
    }

    function addClass()
    {
        if(POIs.length === 0) getPOIs();
        $("g[id^='W.Layer.FeatureLayer']").find("svg[id^='OpenLayers.Geometry.Point']").attr('stroke', 'white');
        $("g[id^='W.Layer.FeatureLayer']").find("circle[id^='OpenLayers.Geometry.Point']").attr('stroke', 'white');
        $("g[id^='W.Layer.FeatureLayer']").find("path[id^='OpenLayers.Geometry.Polygon']").attr('stroke', '#ca9ace');

        for(var ir = 0; ir < POIs.length; ir++)
        {
            var venueAddressDetails = POIs[ir].getAddress();
            if(selectStreetName === null || selectStreetName === "" || venueAddressDetails === null || venueAddressDetails.attributes.isEmpty === true){continue;}

            if(venueAddressDetails.attributes.street.name == selectStreetName)
            {
                if(WME_ADR_debug) console.log("WME-ADR: add class");
                $("g[id^='W.Layer.FeatureLayer']").find("svg[id='" + POIs[ir].geometry.id + "']").attr('stroke', 'yellow');
                $("g[id^='W.Layer.FeatureLayer']").find("circle[id='" + POIs[ir].geometry.id + "']").attr('stroke', 'yellow');
                $("g[id^='W.Layer.FeatureLayer']").find("path[id='" + POIs[ir].geometry.id + "']").attr('stroke', 'yellow');
            }
        }
    }

    function showTitle()
    {
        if(W.selectionManager.getSelectedFeatures().length === 1 && W.selectionManager.getSelectedFeatures()[0].model.type == "segment")
        {
            if(W.selectionManager.getSelectedFeatures()[0].model.attributes.id.toString().indexOf("-") == -1)
            {
                address = W.selectionManager.getSelectedFeatures()[0].model.getAddress();
                var title = "Update addresses";

                if(address.country.id == 37 || address.country.id == 186)
                {
                    title = "Обновить адреса";
                }
                selectStreetName = address.street.name;
                if(selectStreetName !== null)
                    $('.more-actions').append('<button id="addPOIs" class="action-button btn btn-default">' + title + '</button>');
                addClass();
            }

        }
        else if(W.selectionManager.getSelectedFeatures().length === 1 &&W.selectionManager.getSelectedFeatures()[0].model.type == "venue")
        {
            address = W.selectionManager.getSelectedFeatures()[0].model.getAddress().attributes;
            getAddressKadastr();

            if (address.houseNumber !== null && address.street !== null)
            {
                var number = W.selectionManager.getSelectedFeatures()[0].model.getAddress().attributes.houseNumber;
                var streetName = W.selectionManager.getSelectedFeatures()[0].model.getAddress().attributes.street.name;
                var venue = W.selectionManager.getSelectedFeatures()[0].model;

                if(number !== null && (number.indexOf("/") !== -1 || hasChar(number)))
                {
                    $('.aliases-view').parent().parent().append('<a target="_blank" id="_altAddr"" href="#">Добавить корпуса/литеры&nbsp;</a>');
                    $('.aliases-view').parent().parent().on('click', '#_altAddr', function(event) {
                        event.preventDefault();
                        addAliases();
                    });
                }
            }
        }
        else
        {
            if(WME_ADR_debug) console.log("WME-ADR: showTitle(): segment isn't selected");
            $("g[id^='W.Layer.FeatureLayer']").find("svg[id^='OpenLayers.Geometry.Point']").attr('stroke', 'white');
            $("g[id^='W.Layer.FeatureLayer']").find("circle[id^='OpenLayers.Geometry.Point']").attr('stroke', 'white');
            $("g[id^='W.Layer.FeatureLayer']").find("path[id^='OpenLayers.Geometry.Polygon']").attr('stroke', '#ca9ace');
            return;
        }
    }

    function addAliases()
    {
        var number = W.selectionManager.getSelectedFeatures()[0].model.getAddress().attributes.houseNumber;
        var streetName = W.selectionManager.getSelectedFeatures()[0].model.getAddress().attributes.street.name;
        var venue = W.selectionManager.getSelectedFeatures()[0].model;

        if(number !== null && (number.indexOf("/") !== -1 || hasChar(number)))
        {
            var aliases = venue.attributes.aliases;

            var length = venue.attributes.aliases.length;
            var altName = number + " " + streetName;

            var hasAliasAddress = false;
            for(var ia = 0; ia < length; ia++)
            {
                if(altName == venue.attributes.aliases[ia])
                {
                    hasAliasAddress = true;
                }
            }
            if(!hasAliasAddress)
            {
                aliases.push(altName);
                haveChanges = true;
            }

            if(number.indexOf("/") != -1)
            {
                hasAliasAddress = false;
                var altName = number.replace('/', 'к') + " " + streetName;
                for(var ia = 0; ia < length; ia++)
                {
                    if(altName == venue.attributes.aliases[ia])
                    {
                        hasAliasAddress = true;
                    }
                }
                if(!hasAliasAddress)
                {
                    aliases.push(altName);
                    haveChanges = true;
                }
                hasAliasAddress = false;
                var altName = number.replace('/', ' корпус ') + " " + streetName;
                for(var ia = 0; ia < length; ia++)
                {
                    if(altName == venue.attributes.aliases[ia])
                    {
                        hasAliasAddress = true;
                    }
                }
                if(!hasAliasAddress)
                {
                    aliases.push(altName);
                    haveChanges = true;
                }
            }

            if(haveChanges)
            {
                $('.aliases-view .add').click();
                $('.aliases-view .delete').click();
                W.model.actionManager.add(new wazeActionUpdateObject(venue, {aliases : aliases}));
            }
        }
    }

    function createPOI(poiobject, isRH)
    {
        if(WME_ADR_debug) console.log("WME-ADR: --- createPOI(): isRH="+isRH, poiobject);
        var poi = new wazefeatureVectorLandmark();
        var geometry = new OpenLayers.Geometry.Point();
        var emptyStreetStatus = false;

        geometry.x = poiobject.x - 1 + (isRH ? 2 : 0);
        geometry.y = poiobject.y;
        poi.geometry = geometry;
        poi.attributes.categories = ["OTHER"];
        if (!isRH) poi.attributes.name = poiobject.houseNumber.toUpperCase();
        poi.attributes.lockRank = document.getElementById('_lockLevel').selectedIndex;

        if(!isRH && hasChar(poiobject.houseNumber) || poiobject.houseNumber.indexOf("/") !== -1)
        {
            if(WME_ADR_debug && hasChar(poiobject.houseNumber)) console.log("WME-ADR: createPOI(): Has char ("+poiobject.houseNumber+")");
            poi.attributes.aliases.push(poiobject.houseNumber.toUpperCase() + " " + poiobject.streetName);
            poi.attributes.name = poiobject.houseNumber.toUpperCase();
        }

        if(!isRH && poiobject.houseNumber.indexOf("/") != -1)
        {
            if(WME_ADR_debug) console.log("WME-ADR: createPOI(): Has '/' ("+poiobject.houseNumber+")");
            poi.attributes.aliases.push(poiobject.houseNumber.replace('/', 'к') + " " + poiobject.streetName);
            poi.attributes.aliases.push(poiobject.houseNumber.replace('/', ' корпус ') + " " + poiobject.streetName);
        }

        if(isRH && (hasChar(poiobject.houseNumber) || poiobject.houseNumber.indexOf("/") != -1))
        {
            if(WME_ADR_debug) console.log("WME-ADR: createPOI(): RH has char or '/' EXIT ("+poiobject.houseNumber+")");
            return;
        }

        if (poiobject.streetName == 'Null' || poiobject.streetName == 'NULL' || poiobject.streetName == '') {
            poiobject.streetName = '';
            emptyStreetStatus = true;
        }

        W.model.actionManager.add(new wazeActionAddLandmark(poi));
        var poiAddress = poi.getAddress().attributes;

        if(poiAddress.city === null)
        {
            if(WME_ADR_debug) console.log("WME-ADR: createPOI(): null city", poiobject);
            return;
        }

        var newAddressAtts = {
            streetName: poiobject.streetName,
            emptyStreet: emptyStreetStatus,
            cityName: (poiAddress.city.attributes.name.indexOf(poiobject.cityName) != -1) ? poiAddress.city.attributes.name : poiobject.cityName,
            emptyCity: false,
            stateID: poiAddress.state.id,
            countryID: poiAddress.country.id
        };

        W.model.actionManager.add(new wazeActionUpdateFeatureAddress(poi, newAddressAtts,{streetIDField: 'streetID'}));

        W.model.actionManager.add(new wazeActionUpdateObject(poi,{houseNumber: poiobject.houseNumber.toUpperCase(),residential: isRH,}));
        POIs.push(poi);
        if(WME_ADR_debug) console.log("WME-ADR: createPOI(): added to POI list ("+poiobject.streetName+", "+poiobject.houseNumber.toUpperCase()+")", poi);
    }

    function addPOIs()
    {
        if(WME_ADR_debug) console.log("WME-ADR: --- addPOIs()");
        getPOIs();
        $(".more-actions .edit-house-numbers").click();

        setTimeout(function()
        {
            $('.waze-icon-exit').click();

            if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): HN", W.model.houseNumbers.objects);
            for(var key in W.model.houseNumbers.objects)
            {
                //if (key != address.street.id) {continue;}
                if(W.model.houseNumbers.objects[key].numbers.length > 0)
                {
                    if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): HN count("+W.model.houseNumbers.objects[key].numbers.length+")");
                    for(var i = 0; i < W.model.houseNumbers.objects[key].numbers.length; i++)
                    {
                        //console.log(W.model.houseNumbers.objects[key].getSegment());
                        if(W.model.houseNumbers.objects[key].getSegment() === undefined)
                        {
                            if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): undefined segment");
                            continue;
                        }
                        if(W.model.houseNumbers.objects[key].getSegment().getAddress().street === null)
                        {
                            if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): null street", W.model.houseNumbers.objects[key].getSegment().getAddress());
                            continue;
                        }
                        if(W.model.houseNumbers.objects[key].getSegment().getAddress().attributes.street.name != address.street.name)
                        {
                            if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): other streetName ("+address.street.name+")", W.model.houseNumbers.objects[key].getSegment().getAddress().attributes.street.name);
                            continue;
                        }
                        if(!W.map.getExtent().intersectsBounds(W.model.houseNumbers.objects[key].numbers[i].geometry.getBounds()))
                        {
                            if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): out of screen", W.model.houseNumbers.objects[key].numbers[i].number);
                            continue;
                        }

                        var number = W.model.houseNumbers.objects[key].numbers[i].number;
                        var hasPOI = false;
                        var hasRH = false;

                        for(var ir = 0; ir < POIs.length; ir++)
                        {
                            var venue = POIs[ir];
                            var venueAddress = venue.getAddress().attributes;
                            if(venueAddress === null || venueAddress.isEmpty === true)
                            {
                                if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): empty venueAddress");
                                continue;
                            }

                            if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): NH:  "+address.city.attributes.name+", "+address.street.name+", "+number,address);
                            if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): POI: "+venueAddress.city.attributes.name+", "+venueAddress.street.name+", "+venueAddress.houseNumber+", RH="+venue.isResidential(),venueAddress);
                            if(address.city.attributes.name.indexOf(venueAddress.city.attributes.name) != -1
                                && address.street.name == venueAddress.street.name
                                && (venueAddress.houseNumber !== null && number.toLowerCase() == venueAddress.houseNumber.toLowerCase())
                                && (venue.isResidential()
                                || (!venue.isResidential() && venue.attributes.name.toLowerCase() == number.toLowerCase()))
                            )
                            {
                                if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): *** found equal ("+venueAddress.city.attributes.name+", "+venueAddress.street.name+", "+venueAddress.houseNumber+")");

                                if (document.getElementById('_updateLock').checked && venue.attributes.lockRank < document.getElementById('_lockLevel').selectedIndex)
                                {
                                    var newLock = {};
                                    newLock.lockRank = document.getElementById('_lockLevel').selectedIndex;
                                    W.model.actionManager.add(new wazeActionUpdateObject(venue, newLock));
                                    if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): update lock "+venue.attributes.lockRank+" -> "+newLock.lockRank);
                                }

                                if(venue.isResidential())
                                    hasRH = true;
                                else
                                    hasPOI = true;

                                if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): isResidential("+venue.isResidential()+"), isPoint("+venue.isPoint()+")", venue);

                                if(venue.isPoint() && document.getElementById('_allignToHN').checked)
                                {
                                    if(venue.isResidential())
                                    {
                                        var oldCoord = venue.geometry.clone();
                                        var newCoord = W.model.houseNumbers.objects[key].numbers[i].geometry.clone();
                                        if ((oldCoord.x.toFixed(1) !== (newCoord.x+1).toFixed(1)) || (oldCoord.y.toFixed(1) !== newCoord.y.toFixed(1)))
                                        {
                                            newCoord.x++;
                                            if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): move residential", oldCoord, newCoord);

                                            var wazeActionUpdateFeatureGeometry = require("Waze/Action/UpdateFeatureGeometry");
                                            var action = new wazeActionUpdateFeatureGeometry(venue, W.model.venues, oldCoord, newCoord);
                                            W.model.actionManager.add(action);
                                        }
                                    }
                                    else
                                    {
                                        var oldCoord = venue.geometry.clone();
                                        var newCoord = W.model.houseNumbers.objects[key].numbers[i].geometry.clone();
                                        if ((oldCoord.x.toFixed(1) !== (newCoord.x-1).toFixed(1)) || (oldCoord.y.toFixed(1) !== newCoord.y.toFixed(1)))
                                        {
                                            newCoord.x--;
                                            if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): move poi", oldCoord, newCoord);

                                            var wazeActionUpdateFeatureGeometry = require("Waze/Action/UpdateFeatureGeometry");
                                            var action = new wazeActionUpdateFeatureGeometry(venue, W.model.venues, oldCoord, newCoord);
                                            W.model.actionManager.add(action);
                                        }
                                    }
                                }

                                if(number.indexOf("/") !== -1 || hasChar(number))
                                {
                                    if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): has char or '/'("+number+"), skip creating RH");
                                    hasRH = true;
                                }
                            }

                            if(!venue.isPoint() && document.getElementById('_updatePlaces').checked)
                            {
                                if(venue.geometry.intersects(W.model.houseNumbers.objects[key].numbers[i].geometry))
                                {
                                    if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): HN ("+number+") in POI area", W.model.houseNumbers.objects[key].numbers[i].geometry, venue.geometry);
                                    var state = updateLandmark(venue, address.city.attributes.name, address.street.name, number);
                                    hasPOI = (hasPOI) ? hasPOI : state[0];
                                    hasRH = (hasRH) ? hasRH : state[1];
                                }
                                else
                                {
                                    if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): HN NOT in POI area", W.model.houseNumbers.objects[key].numbers[i].geometry, venue.geometry);
                                }
                            }
                        }
                        if(WME_ADR_debug) console.log("WME-ADR: addPOIs(): hasRH: " + hasRH +  ", hasPOI: " + hasPOI + ", hasChar: " + (number.indexOf("/") !== -1 || hasChar(number)));

                        if(!hasPOI && (document.getElementById('_createPOI').checked || (number.indexOf("/") !== -1 || hasChar(number))))
                        {
                            createPOI(
                                {
                                    x: W.model.houseNumbers.objects[key].numbers[i].geometry.x,
                                    y: W.model.houseNumbers.objects[key].numbers[i].geometry.y,
                                    streetName: address.street.name,
                                    houseNumber: number,
                                    cityName: address.city.attributes.name
                                }, false);
                        }
                        if(!hasRH && document.getElementById('_createRH').checked)
                        {
                            createPOI(
                                {
                                    x: W.model.houseNumbers.objects[key].numbers[i].geometry.x,
                                    y: W.model.houseNumbers.objects[key].numbers[i].geometry.y,
                                    streetName: address.street.name,
                                    houseNumber: number,
                                    cityName: address.city.attributes.name
                                }, true);
                        }

                    }
                }
            }
        }, 3000);
    }

    function updateLandmark(venue, cityName, streetName, number)
    {
        if(WME_ADR_debug) console.log("WME-ADR: --- updateLandmark("+cityName+", "+streetName+", "+number+")", venue);
        var hasPOI = false;
        var hasRH = false;
        var emptyStreetStatus = false;

        if(venue.getAddress().attributes.street.name != streetName
            || venue.getAddress().attributes.houseNumber != number
//            || venue.attributes.name != number
//            || venue.attributes.name.indexOf(number) !== 0 // номер не в начале
            || venue.attributes.name === "" // не заполнено имя
            || (document.getElementById('_updateLock').checked && venue.attributes.lockRank < document.getElementById('_lockLevel').selectedIndex)
        )
        {
            var haveChanges = false;
            hasPOI = true;

            if (streetName == 'Null' || streetName == 'NULL' || streetName == '') {
                streetName = '';
                emptyStreetStatus = true;
            }

            if((venue.getAddress().attributes.street.name != streetName && streetName.indexOf(" ") == -1) || address.city.attributes.name.indexOf(cityName) != -1)
            {
                var newAddressAtts = {
                    streetName: streetName,
                    emptyStreet: emptyStreetStatus,
                    cityName: (address.city.attributes.name.indexOf(cityName) != -1) ? address.city.attributes.name : cityName,
                    emptyCity: false,
                    stateID: address.state.id,
                    countryID: address.country.id
                };
                W.model.actionManager.add(new wazeActionUpdateFeatureAddress(venue, newAddressAtts,{streetIDField: 'streetID'}));
                haveChanges = true;

                if(WME_ADR_debug && address.city.attributes.name !== newAddressAtts.cityName) console.log("WME-ADR: updateLandmark(): City '"+address.city.attributes.name+"' -> '"+cityName+"'");
                if(WME_ADR_debug && venue.getAddress().attributes.street.name != streetName) console.log("WME-ADR: updateLandmark(): City '"+venue.getAddress().attributes.street.name+"' -> '"+streetName+"'");
            }

            var newAtts = {};
            if(venue.attributes.houseNumber != number.toString() && number.indexOf(" ") == -1)
            {
                if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): HN '"+venue.attributes.houseNumber+"' -> '"+number+"'");
                newAtts.houseNumber = number;
                haveChanges = true;
            }
            if(/*venue.attributes.name.indexOf(number) !== 0 ||*/ venue.attributes.name === "" || venue.attributes.name.toUpperCase () == number)
            {
                if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): Name '"+venue.attributes.name+"' -> '"+number+"'");
                newAtts.name = number;
                haveChanges = true;
            }

            var aliases = venue.attributes.aliases;
            if(hasChar(number))
            {
                if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): has char ("+number+")");
                hasRH = true;

                var length = venue.attributes.aliases.length;
                var street = number + " " + streetName;

                var hasAliasAddress = false;
                for(var ia = 0; ia < length; ia++)
                {
                    if(street == venue.attributes.aliases[ia])
                    {
                        if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): alias exists '"+street+"'");
                        hasAliasAddress = true;
                    }
                }
                if(!hasAliasAddress)
                {
                    if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): add alias '"+street+"'");
                    aliases.push(street);
                    haveChanges = true;
                }

                if((address.country.id == 37 || address.country.id == 186) && number.indexOf("/") != -1)
                {
                    if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): has '/' ("+number+")");
                    hasAliasAddress = false;
                    var street = number.replace('/', 'к') + " " + streetName;
                    for(var ia = 0; ia < length; ia++)
                    {
                        if(street == venue.attributes.aliases[ia])
                        {
                            if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): alias exists '"+street+"'");
                            hasAliasAddress = true;
                        }
                    }
                    if(!hasAliasAddress)
                    {
                        if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): add alias '"+street+"'");
                        aliases.push(street);
                        haveChanges = true;
                    }
                    hasAliasAddress = false;
                    var street = number.replace('/', ' корпус ') + " " + streetName;
                    for(var ia = 0; ia < length; ia++)
                    {
                        if(street == venue.attributes.aliases[ia])
                        {
                            if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): alias exists '"+street+"'");
                            hasAliasAddress = true;
                        }
                    }
                    if(!hasAliasAddress)
                    {
                        if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): add alias '"+street+"'");
                        aliases.push(street);
                        haveChanges = true;
                    }
                }
            }

            if(haveChanges)
            {
                newAtts.aliases = aliases;
                newAtts.lockRank = document.getElementById('_lockLevel').selectedIndex;
                W.model.actionManager.add(new wazeActionUpdateObject(venue, newAtts));
                POIs.push(venue);
                if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): POI updated (hasRH: " + hasRH +  ", hasPOI: " + hasPOI+ ")", venue);
            }
        }
        else
        {
            if(WME_ADR_debug) console.log("WME-ADR: updateLandmark(): NOT changed POI=HN('"+venue.getAddress().attributes.street.name+"' = '"+streetName+"', "+
                "'"+venue.getAddress().attributes.houseNumber+"' = '"+number+"', "+
                "'"+venue.attributes.name+"' = '"+number+"', )");
        }
        return [hasPOI, hasRH];
    }

    function addAltNames(arr)
    {
        if($('.alias-name').length > 0)
        {
            $("#landmark-edit-general .aliases-view .delete").click();
        }
        for(var i = 0; i < arr.length; i++)
        {
            $("#landmark-edit-general .aliases-view .add").click();

            var elem;
            $('#landmark-edit-general .aliases-view input[type=text]').each(function(index) {
                if(i == index) { elem = $(this); }
            });
            elem.val(arr[i]);
            elem.change();
        }
    }

    function isChar(number)
    {
        var reg = /([0-9])[А-Яа-я]/;
        switch(true)
        {
            case reg.test(number):
                return true;
            default:
                return false;
        }
    }

    function hasChar(number)
    {
        var reg = /[а-яА-Яa-zA-Z/-]/;
        switch(true)
        {
            case reg.test(number):
                return true;
            default:
                return false;
        }
    }

    function getElementsByClassName(classname, node) {
        if(!node)
            node = document.getElementsByTagName("body")[0];
        var a = [];
        var re = new RegExp('\\b' + classname + '\\b');
        var els = node.getElementsByTagName("*");
        for (var i=0,j=els.length; i<j; i++)
            if (re.test(els[i].className)) a.push(els[i]);
        return a;
    }

    function getAddressKadastr()
    {
        if(W.selectionManager.getSelectedFeatures()[0].geometry.components !== undefined)
        {
            var minX = 10000000,
                minY = 100000000,
                maxX = 0,
                maxY = 0;

            var coordinates = W.selectionManager.getSelectedFeatures()[0].geometry.components[0].components;
            for(var i = 0; i < coordinates.length; i++)
            {
                var coordinate = coordinates[i];

                if(coordinate.x < minX) minX = coordinate.x;
                if(coordinate.y < minY) minY = coordinate.y;
                if(coordinate.x > maxX) maxX = coordinate.x;
                if(coordinate.y > maxY) maxY = coordinate.y;

            }
            var ncaURL = 'http://map.nca.by/proxy.php?http://ArcGISServer:8399/arcgis/rest/services/ADDRESS_NEW/MapServer/identify?f=json&geometry=' + minX + ',' + minY + ',' + maxX + ',' + maxY + '&tolerance=6&returnGeometry=true&mapExtent={%22xmin%22%3A' + minX + '%2C%22ymin%22%3A' + minY + '%2C%22xmax%22%3A' + maxX + '%2C%22ymax%22%3A' + maxY + '%2C%22spatialReference%22%3A{%22wkid%22%3A102100}}&imageDisplay=820%2C493%2C96&geometryType=esriGeometryEnvelope&sr=102100&layers=visible';

            $('.toggle-residential').parent().parent().append('<a target="_blank" id="_ncaLink"" href="#">nca.by&nbsp;</a>');
            $('.toggle-residential').parent().parent().append('<input type="text" name="ncajson" id="ncajson" value="" />');
            $('.toggle-residential').parent().parent().append('<button id="addPOIs2" class="action-button btn btn-default">Поставить адреса</button>');

            //console.log("minX = " + minX, "minY = " + minY, "maxX = " + maxX, "maxY = " + maxY);

            try
            {
                document.getElementById('_ncaLink').onclick = function(event){
                    event.preventDefault();
                    window.open(ncaURL);
                    document.getElementById('ncajson').focus();
                    return false;
                };
            }
            catch(e){}
        }
    }

    function setAddressFromJSON(ncaJSON, type)
    {
        if(WME_ADR_debug) console.log("WME-ADR: --- setAddressFromJSON()");
        var len = ncaJSON.results.length;

        if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): found "+len+" addresses in cadastre");

        for(var i = 0; i < len; i++)
        {
            var point = new OpenLayers.Geometry.Point();
            point.x = ncaJSON.results[i].geometry.x;
            point.y = ncaJSON.results[i].geometry.y;

            if(!ncaPolygon.intersects(point))
            {
                if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): address out of interested area, SKIP creating", point, ncaPolygon);
                continue;
            }

            var hasPOI = false;
            var hasRH = false;
            if(ncaJSON.results[i].attributes.IM_TYPE != type){continue;}

            ncaJSON.results[i].attributes.ELEMENTTYP = ncaJSON.results[i].attributes.ELEMENTTYP.replace('ул.', 'улица')
                .replace('пер.', 'переулок')
                .replace('просп.', 'проспект')
                .replace('пр-т', 'проспект')
                .replace('пр-д', 'проезд')
                .replace('пл.', 'площадь')
                .replace('ш.', 'шоссе')
                .replace('б-р', 'бульвар')
                .replace('тр-т', 'тракт')
                .replace('м-н', 'микрорайон')
                .replace('туп.', 'тупик')
                .replace('сп.', 'спуск');

            ncaJSON.results[i].attributes.ELEMENTNAM = ncaJSON.results[i].attributes.ELEMENTNAM.replace('Я.Коласа', 'Якуба Коласа')
                .replace('Я. Коласа', 'Якуба Коласа')
                .replace('Я.Купалы', 'Янки Купалы')
                .replace('Я. Купалы', 'Янки Купалы')
                .replace('Ф.Скорины', 'Франциска Скорины')
                .replace('Ф. Скорины', 'Франциска Скорины')
                .replace('Б.Хмельницкого', 'Богдана Хмельницкого')
                .replace('Б. Хмельницкого', 'Богдана Хмельницкого')
                .replace('К.Маркса', 'Карла Маркса')
                .replace('Сов.пограничников','Советских пограничников')
                .replace('Новоселов','Новосёлов')
                .replace('м-н', 'микрорайон');

            if(ncaJSON.results[i].attributes.ELEMENTTYP == "0" || ncaJSON.results[i].attributes.ELEMENTTYP == "Null" || ncaJSON.results[i].attributes.ELEMENTTYP == "NULL") {
                ncaJSON.results[i].attributes.ELEMENTTYP = '';
            }
            var namestreet = '';
            namestreet += (ncaJSON.results[i].attributes.ELEMENTTYP != '') ? ncaJSON.results[i].attributes.ELEMENTTYP + ' ' : '';
            namestreet += ncaJSON.results[i].attributes.ELEMENTNAM;
            var cityName = ncaJSON.results[i].attributes.OBJ_NAME.replace("д. ", "")
                .replace("аг. ", "")
                .replace("г. ", "")
                .replace("п. ", "")
                .replace("гп ", "")
                .replace("х. ", "");

            cityName = cityName.replace('Могилев', 'Могилёв');
//            cityName = cityName.replace(' ', '\u00A0');

            if(namestreet === " ")
            {
                namestreet = cityName;
            }

            if(ncaJSON.results[i].attributes.NUM_HOUSE != "0" && ncaJSON.results[i].attributes.NUM_HOUSE != "Null" && ncaJSON.results[i].attributes.NUM_HOUSE != "NULL") {
                var number = ncaJSON.results[i].attributes.NUM_HOUSE;
            }
            if(number != '' && ncaJSON.results[i].attributes.IND_HOUSE != "0" && ncaJSON.results[i].attributes.IND_HOUSE != "Null" && ncaJSON.results[i].attributes.IND_HOUSE != "NULL") {
                number += ncaJSON.results[i].attributes.IND_HOUSE;
            }
            if(number != '' && ncaJSON.results[i].attributes.NUM_CORP != "0" && ncaJSON.results[i].attributes.NUM_CORP != "Null" && ncaJSON.results[i].attributes.NUM_CORP != "NULL") {
                number = number + '/' + ncaJSON.results[i].attributes.NUM_CORP;
            }

            if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): cadastre address("+cityName+", "+namestreet+", "+number+")");

            for(var ir = 0; ir < POIs.length; ir++)
            {
                var venue = POIs[ir];
                var venueAddress = venue.getAddress().attributes;

                if(venueAddress === null || venueAddress.isEmpty === true){continue;}

                if(venueAddress.city.attributes.name.indexOf(cityName) != -1
                    && namestreet == venueAddress.street.name
                    && (venueAddress.houseNumber != null && number.toLowerCase() == venueAddress.houseNumber.toLowerCase())
                    && (venue.isResidential()
                    || (!venue.isResidential() && venue.attributes.name.toLowerCase() == number.toLowerCase()))
                )
                {
                    if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): *** found equal ("+venueAddress.city.attributes.name+", "+venueAddress.street.name+", "+venueAddress.houseNumber+")");

                    if (document.getElementById('_updateLock').checked && venue.attributes.lockRank < document.getElementById('_lockLevel').selectedIndex)
                    {
                        var newLock = {};
                        newLock.lockRank = document.getElementById('_lockLevel').selectedIndex;
                        W.model.actionManager.add(new wazeActionUpdateObject(venue, newLock));
                        if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): update lock "+venue.attributes.lockRank+" -> "+newLock.lockRank);
                    }

                    if(venue.isResidential())
                        hasRH = true;
                    else
                        hasPOI = true;

                    if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): isResidential("+venue.isResidential()+"), isPoint("+venue.isPoint()+")", venue);

                    if(number.indexOf("/") !== -1 || hasChar(number))
                    {
                        if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): has char or '/'("+number+"), skip creating RH");
                        hasRH = true;
                    }
                }

                if(!venue.isPoint() && document.getElementById('_updatePlaces').checked)
                {
                    var wazefeatureVectorLandmark = require("Waze/Feature/Vector/Landmark");
                    var poi = new wazefeatureVectorLandmark();
                    poi.geometry = point;

                    if(venue.geometry.intersects(poi.geometry))
                    {
                        if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): address ("+number+") in POI area", poi.geometry, venue.geometry);
                        var state = updateLandmark(venue, cityName, namestreet, number);
                        hasPOI = (hasPOI) ? hasPOI : state[0];
                        hasRH = (hasRH) ? hasRH : state[1];
                    }
                    else
                    {
                        if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): address NOT in POI area", poi.geometry, venue.geometry);
                    }
                }
            }
            if(WME_ADR_debug) console.log("WME-ADR: setAddressFromJSON(): hasRH: " + hasRH +  ", hasPOI: " + hasPOI + ", hasChar: " + (number.indexOf("/") !== -1 || hasChar(number)));

            if(!hasPOI && (document.getElementById('_createPOI').checked || (number.indexOf("/") !== -1 || hasChar(number))))
            {
                createPOI(
                    {
                        x: ncaJSON.results[i].geometry.x,
                        y: ncaJSON.results[i].geometry.y,
                        streetName: namestreet,
                        houseNumber: number,
                        cityName: cityName
                    }, false);
            }
            if(!hasRH && document.getElementById('_createRH').checked)
            {
                createPOI(
                    {
                        x: ncaJSON.results[i].geometry.x,
                        y: ncaJSON.results[i].geometry.y,
                        streetName: namestreet,
                        houseNumber: number,
                        cityName: cityName
                    }, true);
            }
        }
    }
}

altAddress_bootstrap();

/* **************************************** */

var _createClass=function(){function a(b,c){for(var f,d=0;d<c.length;d++)f=c[d],f.enumerable=f.enumerable||!1,f.configurable=!0,"value"in f&&(f.writable=!0),Object.defineProperty(b,f.key,f)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}();function _classCallCheck(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")}var NavigationPoint=function(){function a(b){_classCallCheck(this,a),this._point=b.clone(),this._entry=!0,this._exit=!0,this._isPrimary=!0,this._name=""}return _createClass(a,[{key:"with",value:function _with(){var b=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};return null==b.point&&(b.point=this.toJSON().point),new this.constructor((this.toJSON().point,b.point))}},{key:"getPoint",value:function getPoint(){return this._point.clone()}},{key:"getEntry",value:function getEntry(){return this._entry}},{key:"getExit",value:function getExit(){return this._exit}},{key:"getName",value:function getName(){return this._name}},{key:"isPrimary",value:function isPrimary(){return this._isPrimary}},{key:"toJSON",value:function toJSON(){return{point:this._point,entry:this._entry,exit:this._exit,primary:this._isPrimary,name:this._name}}},{key:"clone",value:function clone(){return this.with()}}]),a}();