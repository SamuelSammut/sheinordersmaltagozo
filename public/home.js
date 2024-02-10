class ItemAdder {
    constructor() {
        this.addItemButton = document.getElementById('addItemButton');
        this.itemsWrap = document.getElementById('itemFieldsWrap');
        this.init();
    }

    init() {
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.addItemButton.addEventListener('click', () => this.cloneItemFields());
    }

    cloneItemFields() {
        const originalItem = this.itemsWrap.querySelector('.itemFields').cloneNode(true);
        
        originalItem.querySelectorAll('input, select').forEach(input => {
            input.value = ''; // Clear input values for the clone
            const name = input.getAttribute('name');
            if(name) {
                // Assuming the name format is `attribute[index]`, find the last item index and increment it
                const lastItemIndex = this.itemsWrap.querySelectorAll('.itemFields').length - 1; // Get current last index
                const newName = name.replace(/\[\d+\]$/, `[${lastItemIndex + 1}]`); // Increment index for new item
                input.setAttribute('name', newName); // Set the new name with updated index
            }
        });
    
    
        // Remove any existing remove button in the clone
        const existingRemoveBtn = originalItem.querySelector('.removeItem');
        if (existingRemoveBtn) {
            existingRemoveBtn.parentNode.removeChild(existingRemoveBtn);
        }
    
        // Adjust the column sizes before appending the remove button
        this.adjustColumnSizes(originalItem);
    
        // Append the remove button to the last column of the item fields
        this.appendRemoveButtonToLastColumn(originalItem);
    
        this.itemsWrap.insertBefore(originalItem, this.addItemButton);
    }
    
    adjustColumnSizes(itemFields) {
        // Adjusting each column to fit the delete button within the row
        const columns = itemFields.querySelectorAll('.row .col-md-3');
        columns.forEach(column => {
            column.classList.replace('col-md-3', 'col-sm'); // Changing from col-md-3 to col-md-2
        });
    }
    
    appendRemoveButtonToLastColumn(itemFields) {
        const removeButton = this.createRemoveButton();
        removeButton.style.transform = 'translateY(17px)'; // Adjust the pixel value as needed

        // Create a new column for the remove button
        const buttonColumn = document.createElement('div');
        buttonColumn.className = 'col-sm-1 d-flex justify-content-center align-items-center'; // Adjusting to col-md-2 for the button
        buttonColumn.appendChild(removeButton);
    
        // Append the buttonColumn to the row
        itemFields.querySelector('.row').appendChild(buttonColumn);
    }
    
    

    createRemoveButton() {
        const button = document.createElement('button');
        button.innerHTML = '<i class="fas fa-trash"></i>';
        button.className = 'removeItem btn btn-danger btn-sm';
        button.type = 'button';
        button.style.marginLeft = '10px';
        button.addEventListener('click', function() {
            this.closest('.itemFields').remove();
        });
        return button;
    }
}

document.addEventListener('DOMContentLoaded', () => new ItemAdder());
