/* Prepare a position submission locally; the sender reviews and sends the email. */
(() => {
    "use strict";
    const form = document.getElementById("position-form");
    if (!form) return;
    const status = document.getElementById("position-form-status");
    const policy = form.elements.namedItem("deadline_type");
    const deadline = form.elements.namedItem("deadline");

    function updateDeadline() {
        const fixed = policy.value === "fixed";
        deadline.required = fixed;
        deadline.disabled = !fixed;
        if (!fixed) deadline.value = "";
    }

    function completedTemplate() {
        const sections = Array.from(form.querySelectorAll("fieldset"), fieldset => {
            const heading = fieldset.querySelector("legend").textContent.trim().toUpperCase();
            const fields = Array.from(fieldset.querySelectorAll("[data-template-label]"))
                .filter(field => !field.disabled)
                .map(field => {
                    const raw = field.tagName === "SELECT"
                        ? field.options[field.selectedIndex].textContent
                        : field.value;
                    const value = raw.replace(/\r\n?/g, "\n").trim() || "Not specified";
                    return `${field.dataset.templateLabel}:\n${value}`;
                });
            return `${heading}\n\n${fields.join("\n\n")}`;
        });
        return `SPARC — Open-position submission\n\n${sections.join("\n\n")}\n`;
    }

    function activateLink(href, filename) {
        const link = document.createElement("a");
        link.href = href;
        link.hidden = true;
        if (filename) link.download = filename;
        document.body.append(link);
        link.click();
        link.remove();
    }

    policy.addEventListener("change", updateDeadline);
    form.addEventListener("submit", event => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const body = completedTemplate();
        const recipient = form.dataset.recipient;
        const title = form.elements.namedItem("title").value.replace(/[\r\n]+/g, " ").trim();
        if (event.submitter && event.submitter.value === "download") {
            const blob = new Blob([body], {type: "text/plain;charset=utf-8"});
            const url = URL.createObjectURL(blob);
            const name = title.normalize("NFKD").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "submission";
            activateLink(url, `sparc-position-${name.toLowerCase()}.txt`);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            status.textContent = `Email the downloaded form to ${recipient} for review.`;
        } else {
            const subject = encodeURIComponent(`SPARC open position: ${title}`);
            const encodedBody = encodeURIComponent(body.replace(/\n/g, "\r\n"));
            activateLink(`mailto:${recipient}?subject=${subject}&body=${encodedBody}`);
            status.textContent = "Review and send the draft in your email app. You can also download a completed copy to attach.";
        }
    });
    updateDeadline();
    // The downloadable template and email link remain usable without this form.
    form.hidden = false;
})();
