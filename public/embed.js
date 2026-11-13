/*! Tutorloop enquiry form embed. Usage:
 *  <div id="tutorloop-enquiry"></div>
 *  <script src="https://YOUR-TUTORLOOP-DOMAIN/embed.js" data-org="your-slug" async></script>
 * Optional: data-target="#element-id", data-colour="#4f46e5"
 */
(function () {
  var script = document.currentScript;
  if (!script) return;
  var org = script.getAttribute("data-org");
  if (!org) return console.warn("[tutorloop] data-org attribute is required");
  var origin = new URL(script.src).origin;
  var targetSel = script.getAttribute("data-target") || "#tutorloop-enquiry";
  var colour = script.getAttribute("data-colour");
  var mount = document.querySelector(targetSel);
  if (!mount) {
    mount = document.createElement("div");
    script.parentNode.insertBefore(mount, script);
  }
  var iframe = document.createElement("iframe");
  iframe.src = origin + "/embed/enquiry/" + encodeURIComponent(org) + (colour ? "?colour=" + encodeURIComponent(colour.replace("#", "")) : "");
  iframe.title = "Enquiry form";
  iframe.loading = "lazy";
  iframe.style.cssText = "width:100%;border:0;min-height:560px;background:transparent;color-scheme:light";
  mount.appendChild(iframe);
  window.addEventListener("message", function (e) {
    if (e.origin !== origin || !e.data || e.source !== iframe.contentWindow) return;
    if (e.data.type === "tutorloop:resize") iframe.style.height = e.data.height + "px";
    if (e.data.type === "tutorloop:submitted") mount.dispatchEvent(new CustomEvent("tutorloop:submitted", { bubbles: true }));
  });
})();
