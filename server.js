const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

// Configure the transporter
let transporter = nodemailer.createTransport({
    service: 'gmail', // This example uses Gmail
    auth: {
        user: 'sheinordersmaltagozo@gmail.com', // Your email address
        pass: 'wauuylsplnqcntor' // Your email password
    }
});

function formatFieldName(fieldName) {
    // Insert a space before any uppercase letters or numbers, ensuring numbers stay with words like 'Line2'
    let words = fieldName.replace(/([0-9]+)/g, ' $1').replace(/([A-Z])/g, ' $1');
    
    // Special handling for acronyms or specific words that should not be separated (if any)
    // words = words.replace(special cases here if needed);

    // Trim any leading spaces that the replace method might have introduced at the start of the string
    words = words.trim();
    
    // Capitalize the first letter of each word
    words = words.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    
    return words;
}



const app = express();
const PORT = process.env.PORT || 3000; // Use Heroku's port or default to 3000 for local development
app.use(express.static('public'));
// Use bodyParser middleware to parse JSON bodies
app.use(bodyParser.json());

// Connect to SQLite database
let db = new sqlite3.Database('./mydb.sqlite3', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Error when connecting to the SQLite database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Initialize the OrderCounter table
db.run(`CREATE TABLE IF NOT EXISTS OrderCounter (
    id INTEGER PRIMARY KEY,
    orderNumber INTEGER NOT NULL
)`, (err) => {
    if (err) {
        console.error('Error creating OrderCounter table', err.message);
    } else {
        // Insert initial order number if table is newly created
        db.run(`INSERT INTO OrderCounter (id, orderNumber) SELECT 1, 1 WHERE NOT EXISTS (SELECT 1 FROM OrderCounter WHERE id = 1)`, (err) => {
            if (err) {
                console.error('Error initializing the order number', err.message);
            } else {
                console.log('OrderCounter table is ready.');
            }
        });
    }
});

app.post('/submit-form', (req, res) => {
    db.get(`SELECT orderNumber FROM OrderCounter WHERE id = 1`, (err, row) => {
        if (err) {
            console.error('Error reading from OrderCounter table', err.message);
            return res.status(500).send("Error accessing the database");
        }

        let newOrderNumber = row.orderNumber + 1;
        db.run(`UPDATE OrderCounter SET orderNumber = ? WHERE id = 1`, [newOrderNumber], (updateErr) => {
            if (updateErr) {
                console.error('Error updating OrderCounter table', updateErr.message);
                return res.status(500).send("Error updating the database");
            }

            // Construct email body for the shop
            let emailBody = `Order Number: ${newOrderNumber}\n\nCustomer Details:\n`;
            emailBody += `Name: ${req.body.personalInfo.name}\n`;
            emailBody += `Surname: ${req.body.personalInfo.surname}\n`;
            emailBody += `Email: ${req.body.personalInfo.email}\n`;
            emailBody += `Contact Number: ${req.body.personalInfo.contactnumber}\n`;
            emailBody += `House Number/Name: ${req.body.personalInfo.housenumber}\n`;
            emailBody += `Address Line 1: ${req.body.personalInfo.addressline1}\n`;
            if (req.body.personalInfo.addressLine2) {
                emailBody += `Address Line 2: ${req.body.personalInfo.addressLine2}\n`;
            }
            emailBody += `City: ${req.body.personalInfo.city}\n`;
            emailBody += `Delivery Options: ${req.body.personalInfo.deliveryOptions}\n`;


            
            // Add items to the email body
            if (req.body.items && req.body.items.length > 0) {
                emailBody += `\nItems:\n`;
                req.body.items.forEach((item, index) => {
                    emailBody += `Item ${index + 1}:\n`;
                    emailBody += `  SKU: ${item.SKU}\n`;
                    emailBody += `  Size: ${item.size}\n`;
                    emailBody += `  Color: ${item.color}\n`;
                    emailBody += `  Quantity: ${item.quantity}\n`;
                });
            }

            // Send the email
            transporter.sendMail({
                from: 'sheinordersmaltagozo@gmail.com',
                to: 'sheinordersmaltagozo@gmail.com', // The email address to send to
                subject: `New Order Submitted - Order Number: ${newOrderNumber}`,
                text: emailBody
            }, (emailErr, info) => {
                if (emailErr) {
                    console.log(emailErr);
                    return res.status(500).send('Error sending email');
                } else {
                    console.log('Email sent: ' + info.response);
                    // Respond to client after email is sent and DB is updated
                    res.json({ orderNumber: newOrderNumber });
                }
            });

            const confirmationEmailBody = `Thank you for your order!\nHere are the details:\n\n${emailBody}\nYou will soon receive a request on Revolut on the mobile number provided.\nWhen the payment is received we will send a confirmation email with an estimated delivery date.\nWe appreciate your custom!.
        `;
    
        // Extract the user's email address from the form data
        const userEmail = req.body.personalInfo.email; // Adjust this according to your form data structure
    
        // Send the confirmation email to the user
        transporter.sendMail({
            from: 'sheinordersmaltagozo@gmail.com', // This should be your authenticated email address
            to: userEmail, // The user's email address extracted from the form submission
            subject: `Order Placed - Order Number: ${newOrderNumber}`,
            text: confirmationEmailBody
        }, (confirmationEmailErr, info) => {
            if (confirmationEmailErr) {
                console.log(confirmationEmailErr);
                // You may choose to log this error or handle it accordingly
                // Note: Not sending a separate response here since the response to the client has been sent earlier
            } else {
                console.log('Confirmation email sent: ' + info.response);
                // You might log this success or perform additional actions as needed
            }
        });
        });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});


