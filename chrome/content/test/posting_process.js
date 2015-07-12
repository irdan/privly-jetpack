/**
 * @fileOverview Test suite for lib/posting_process.js
 *
 **/
/* global describe, it, expect, spyOn, g */
describe("Posting Process Suite", function() {

  var pp = g.postingProcess;

  pp.errorNotification = {
    show: function() { return; },
    hide: function() { return; },
  };

  pp.pendingNotification = {
    show: function() { return; },
    hide: function() { return; },
  };
  
  var worker =  {
    port: {
      emit: function(message_id, message) { return; },
      on: function(message_id, callback) { return; },
    },
    destroy: function() { return; },
  };

  beforeEach(function() {
    pp.postingApplicationTab = {
      close: function() { return; },
    };
    pp.postingResultTab = {
      close: function() { return; },
      activate: function() { return; },
      attach: function() { return worker; },
    };
  });

  it("tests menuSetup", function() {
    expect(pp.pendingNotification).toBeDefined();
    expect(pp.errorNotification).toBeDefined();
  });
    
  it("tests notificationScript", function() {
    expect(pp.notificationScript("foobar")).toMatch(/foobar/);
    expect(pp.notificationScript("error")).toMatch(/error/);
  });

  it("tests hideNotification", function() {
    spyOn(pp.errorNotification, "hide");
    pp.hideNotification("error");
    expect(pp.errorNotification.hide).toHaveBeenCalled();
    spyOn(pp.pendingNotification, "hide");
    pp.hideNotification("pendingPost");
    expect(pp.pendingNotification.hide).toHaveBeenCalled();
  });

  it("tests sendBtnStatus", function() {
    spyOn(worker.port, "emit");
    // Default option is false
    expect(g.ls.getItem("Options:DissableButton")).toBe(false);
    pp.sendBtnStatus("foobar", worker);
    expect(worker.port.emit).toHaveBeenCalled();
    // Switch to another option
    g.ls.setItem("Options:DissableButton", true);
    pp.sendBtnStatus("foobar", worker);
    expect(worker.port.emit).toHaveBeenCalled();
    expect(worker.port.emit.calls.argsFor(0)).toEqual(["privlyBtnStatus", "unchecked"]);
    expect(worker.port.emit.calls.argsFor(1)).toEqual(["privlyBtnStatus", "checked"]);
  });

  it("tests saveSecret", function() {
    pp.saveSecret("foobar");
    expect(pp.messageSecret).toBe("foobar");
  });
 
  it("tests sendInitialContent", function() {
    spyOn(worker.port, "emit");
    pp.messageSecret = "foo";
    pp.postingApplicationStartingValue = "bar";
    pp.sendInitialContent("foobar", worker);
    expect(worker.port.emit).toHaveBeenCalled();
    expect(worker.port.emit.calls.argsFor(0)).
      toEqual(["initialContent", {secret: "foo", initialContent: "bar"}]);
    pp.messageSecret = "bar";
    pp.sendInitialContent("foobar", worker);
    expect(worker.port.emit).toHaveBeenCalled();
    expect(worker.port.emit.calls.argsFor(1)).not.
      toEqual(["initialContent", {secret: "foo", initialContent: "bar"}]);
    expect(worker.port.emit.calls.argsFor(1)).
      toEqual(["initialContent", {secret: "bar", initialContent: "bar"}]);
  });

  it("tests postStatusHandler", function() {
    spyOn(pp.errorNotification, "show");
    flag = 0;
    spyOn(pp.postingApplicationTab, "close").and.callFake(function() {
      flag = 1;
      return;
    });
    expect(pp.postingApplicationTab).toBeDefined();
    expect(flag).toBe(0);
    pp.postStatusHandler("success");
    expect(flag).toBe(1);
    expect(pp.postingApplicationTab).toBe(null);
    pp.postStatusHandler("failure");
    expect(pp.errorNotification.show).toHaveBeenCalled();
  });

  it("tests receivePrivlyURL", function() {
    var privlyURL = "https://privly.url";
    spyOn(worker.port, "emit");
    pp.pageURL = "https://page.url";
    pp.targetNodeId = "fakenode";
    pp.workers = [worker];
    pp.pendingPost = true;
    pp.receivePrivlyURL(privlyURL);
    expect(worker.port.emit).toHaveBeenCalled();
    expect(worker.port.emit.calls.argsFor(0)).
      toEqual(["postURL", {privlyURL: privlyURL, nodeId: "fakenode", pageURL: "https://page.url"}]);
    expect(pp.pendingPost).toBe(false);
  });

  it("tests postingHandler", function() {
    spyOn(pp.pendingNotification, "show");
    var info =  {
      pageURL: "chrome://privly/content/test/test_loader.html",
      text: "Hello",
      nodeId: "fakenode",
    };
    pp.pendingPost = true;
    pp.postingHandler(info);
    expect(pp.pendingNotification.show).toHaveBeenCalled();
    pp.pendingPost = false;
    pp.postingHandler(info);
    expect(pp.pendingPost).toBe(true);
    expect(pp.targetNodeId).toBe("fakenode");
  });

  it("tests tabClosed", function() {
    spyOn(pp.postingApplicationTab, "close");
    pp.pendingPost = true;
    pp.tabClosed({}, "resultTab");
    expect(pp.postingApplicationTab).toBe(null);
    expect(pp.postingResultTab).toBe(null);
    expect(pp.pendingPost).toBe(false);
    pp.pendingPost = true;
    pp.tabClosed({}, "postingApplication");
    expect(pp.pendingPost).toBe(true);
  });
});
