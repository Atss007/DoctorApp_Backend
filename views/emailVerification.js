module.exports.emailVerification = async (/*verificationToken*/ verificationLink) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    margin: 0;
                    padding: 20px;
                }
                button {
                    background-color: #4CAF50; /* Green */
                    border: none;
                    color: white;
                    padding: 15px 32px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 16px;
                    margin: 4px 2px;
                    cursor: pointer;
                }
            </style>
            <script>
                async function verifyEmail(verificationLink) {
                    console.log('Button clicked, attempting to verify email with link:', verificationLink); // Log the verification link
    
                    try {
                        const response = await fetch('verificationLink', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });
                        const result = await response.json();
                             console.log('API response:', result); // Log the response from the API
      
                        alert(result.message); // Display success or error message
                    } catch (error) {
                      console.error('Error during fetch:', error); // Log any errors during fetch
        
                        alert('An error occurred: ' + error.message);
                    }
                }
            </script>
        </head>
        <body>
            <h1>Email Verification</h1>
            <p>Please verify your email address by clicking the button below:</p>
            <button onclick="verifyEmail('${verificationLink}')">Verify Email</button>
            <p>If you did not request this, please ignore this email.</p>
        </body>
        </html>
    `;
}
