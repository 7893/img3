document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const previewArea = document.getElementById('preview');

    fileInput.addEventListener('change', handleFileSelect);

    function handleFileSelect(event) {
        const files = event.target.files;
        
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            
            const reader = new FileReader();
            reader.onload = (e) => createPreviewItem(e.target.result);
            reader.readAsDataURL(file);
        }
    }

    function createPreviewItem(imageUrl) {
        const item = document.createElement('div');
        item.className = 'preview-item';

        const img = document.createElement('img');
        img.src = imageUrl;

        const removeButton = document.createElement('button');
        removeButton.className = 'remove-button';
        removeButton.innerHTML = '×';
        removeButton.addEventListener('click', () => item.remove());

        item.appendChild(img);
        item.appendChild(removeButton);
        previewArea.appendChild(item);
    }
});
