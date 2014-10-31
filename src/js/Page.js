/**
 * Copyright (c) 2014 EclipseSource.
 * All rights reserved.
 */

(function() {

  var pageProperties = ["title", "image", "style", "topLevel"];

  tabris.registerType("_Page", {
    _type: "tabris.Page"
  });

  tabris.registerWidget("Page", {

    _type: "rwt.widgets.Composite",

    _create: function(properties) {
      this.super("_create",  util.extend(util.omit(properties, pageProperties), {
        parent: tabris._shell,
        layoutData: {left: 0, right: 0, top: 0, bottom: 0}
      }));
      this._page = tabris.create("_Page", util.extend(util.pick(properties, pageProperties), {
        parent: tabris._uiProxy._ui,
        control: this
      }));
      return this;
    },

    dispose: function() {
      this.super("dispose");
      this._page.dispose();
    },

    open: function() {
      tabris._uiProxy.setActivePage(this);
    },

    close: function() {
      this.dispose();
      tabris._uiProxy.setLastActivePage();
      this._page.dispose();
    }

  });

  pageProperties.forEach(function(property) {
    tabris.Page._setProperty[property] = function(value) {this._page.set(property, value);};
    tabris.Page._getProperty[property] = function() {return this._page.get(property);};
  });

}());
