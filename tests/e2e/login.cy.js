describe('Login SIGEDIS', () => {
  it('permite acceder con credenciales correctas', () => {
    cy.visit('/login.html');
    cy.get('#correo').type('docente@sigedis.ec');
    cy.get('#password').type('Password123!');
    cy.get('button[type="submit"]').click();
  });
});
