cy.SonicJs = {
  getBaseUrl: () => {
    return "http://localhost:3019";
  },

  login: () => {
    cy.visit(`${cy.SonicJs.getBaseUrl()}/admin`);
    cy.contains("Login");

    cy.get('[type="email"]').type("a@a.com");
    cy.get('[type="password"]').type("tiger44");

    cy.get("#login-submit").click();
  },

  logout: () => {
    cy.get("#logout-button").click({ force: true });
  },

  adminPageVerify: (url, textToVerify) => {
    cy.visit(`${cy.SonicJs.getBaseUrl()}/${url}`);
    cy.contains(textToVerify);
  },

};
