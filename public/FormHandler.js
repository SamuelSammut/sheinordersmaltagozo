class FormHandler {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) {
            console.warn(`Form with ID '${formId}' not found.`);
            return;
        }
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    handleSubmit(e) {
        e.preventDefault(); // Prevent the default form submission
    
        const formData = new FormData(this.form);

        const data = { personalInfo: {}, items: [] };
        let itemCounter = 0; // Counter to keep track of items based on occurrences of a specific field, e.g., 'SKU'
        
        for (const [key, value] of formData.entries()) {
            // Assuming 'SKU' as the starting point for each item group
            if (key.startsWith('SKU')) {
                itemCounter++; // Increment counter for each new item based on 'SKU' field occurrence
                data.items[itemCounter - 1] = data.items[itemCounter - 1] || {}; // Ensure the item object exists
            }
            
            const itemPattern = /^(SKU|size|color|quantity)/;
            const match = key.match(itemPattern);
            
            if (match) {
                const attribute = match[1]; // e.g., "SKU"
                // Use the current item counter as the index for current group of item fields
                data.items[itemCounter - 1][attribute] = value;
            } else {
                // Directly assign values for fields that aren't part of an item
                data.personalInfo[key] = value;
            }
        }
        
        const jsonData = JSON.stringify(data);
        
        fetch('/submit-form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonData
        })
        .then(response => response.json())
        .then(data =>{
            if(data.orderNumber)
            {
                window.location.href = '/confirmation.html';
            }
            else
            {
                alert("There was a problem with your submission. Please try again.");
            }
        })
        .catch(error => {
            console.error('Error submitting form', error);
        })

    }

    }

// Automatic initialization
document.addEventListener('DOMContentLoaded', function() {
    const formId = 'form'; 
    new FormHandler(formId);
});
