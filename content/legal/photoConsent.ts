import { createElement } from "react";

export const photoConsentTitle = "Photography waiver";
export const photoConsentVersion = "v1.0";

const sectionClass = "space-y-3";
const headingClass = "text-sm font-black uppercase tracking-[0.08em] text-[#1f1a25]";
const paragraphClass = "text-sm leading-6 text-[#2E2A33]/85";
const listClass = "list-disc space-y-2 pl-5 text-sm leading-6 text-[#2E2A33]/85";

export const photoConsentContent = createElement(
  "div",
  { className: "space-y-6" },
  createElement(
    "section",
    { className: sectionClass },
    createElement("h3", { className: headingClass }, "Release of liability agreement"),
    createElement("h3", { className: headingClass }, "Photography waiver"),
    createElement(
      "p",
      { className: paragraphClass },
      "PHOTOGRAPHY PARENTAL CONSENT FORM FOR EAGLE GYMNASTICS ACADEMY CLUB IN CONJUNCTION WITH SCOTTISH GYMNASTICS CHILD PROTECTION PROCEDURES."
    )
  ),
  createElement(
    "section",
    { className: sectionClass },
    createElement(
      "h3",
      { className: headingClass },
      "Photographing, videoing and filming of children and protected adults at events"
    ),
    createElement(
      "p",
      { className: paragraphClass },
      "The following is required for Eagle Gymnastic Academy Club (E.G.A.C) Part of Multi-Sports Academy Ltd (M.S.A.LTD) activities or events where children, young people or protected adults are participating:"
    ),
    createElement(
      "ul",
      { className: listClass },
      createElement(
        "li",
        null,
        "All materials promoting Eagle Gymnastic Academy Club (E.G.A.C) Part of Multi-Sports Academy Ltd (M.S.A.LTD) events or activities should state that accredited photographers will be present."
      ),
      createElement(
        "li",
        null,
        "Consent forms should be obtained from the parent/guardian for photographing, videoing and/or filming of a child, young person or protected adult prior to the event or activity."
      ),
      createElement(
        "li",
        null,
        "Anyone wishing to use photographic/film/video equipment at a venue must obtain the approval of (insert name of club)."
      ),
      createElement("li", null, "No unsupervised access or one-to-one sessions should be permitted."),
      createElement(
        "li",
        null,
        "If the event organiser suspects inappropriate filming or photography, they will request the person to leave the venue and surrender any film, device, disc or memory card relating to the event."
      ),
      createElement(
        "li",
        null,
        "The requirements above are publicly promoted to ensure all people present at the event or activity understand the procedure and are aware of whom to contact if concerned."
      )
    ),
    createElement(
      "p",
      { className: paragraphClass },
      "NOTE: When recruiting a photographer for events such as club championships, the Scottish Gymnastics Safe Recruitment Policy must be followed."
    ),
    createElement(
      "p",
      { className: paragraphClass },
      "Concerns about photographers, video or film operators are to be reported to (name of club) Child Protection Co-ordinator and, when relevant, to Scottish Gymnastics Head of Child Protection and the Police."
    ),
    createElement(
      "p",
      { className: "text-sm font-black text-[#7b2437]" },
      "PLEASE NOTE THAT FOR SAFETY, FLASH PHOTOGRAPHY IS NOT PERMITTED."
    )
  ),
  createElement(
    "section",
    { className: sectionClass },
    createElement(
      "p",
      { className: paragraphClass },
      "The use of video equipment is an invaluable aid to coaching. Eagle Gymnastic Academy Club (E.G.A.C) Part of Multi-Sports Academy Ltd (M.S.A.LTD) coaches and helpers use the following guidelines:"
    ),
    createElement(
      "ul",
      { className: listClass },
      createElement(
        "li",
        null,
        "Make participants and parents aware of the purpose of filming as a coaching aid."
      ),
      createElement(
        "li",
        null,
        "At least two responsible and approved adults are present to ensure that the filming is not inappropriate."
      ),
      createElement(
        "li",
        null,
        "Care is taken to ensure video materials are securely stored to avoid inappropriate usage."
      )
    )
  ),
  createElement(
    "section",
    { className: sectionClass },
    createElement(
      "h3",
      { className: headingClass },
      "Consent confirmation"
    ),
    createElement(
      "p",
      { className: paragraphClass },
      "By using the slider please confirm if you consent or not to the following:"
    ),
    createElement(
      "p",
      { className: paragraphClass },
      "I give consent / do not give consent for the taking and appropriate use of videos and photographic material of my/our child. I understand that no personal information will be displayed with any image."
    ),
    createElement(
      "p",
      { className: paragraphClass },
      "I give consent / do not give consent at the scheduled competitions, events, displays and the website of Eagle Gymnastics Academy Club."
    )
  )
);
