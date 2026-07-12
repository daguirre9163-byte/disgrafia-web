describe('CRUD admin', () => {
  it('gestiona docentes desde admin panel', () => {
    cy.visit('/admin/docentes.html');
    cy.get('input[name="nombre"]').type('Docente Cypress');
    cy.get('input[name="email"]').type('cypress@sigedis.ec');
    cy.get('input[name="institucion"]').type('UE Demo');
    cy.get('button[type="submit"]').click();
    cy.contains('Docente Cypress');
  });
});
