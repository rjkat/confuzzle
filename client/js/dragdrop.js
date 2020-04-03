// https://mashtheweb.wordpress.com/2018/08/01/how-to-build-a-really-cool-and-simple-drag-and-drop-page-using-plain-javascript/
export function setupDropArea(dropArea, fileElem, handleFileCallback) {

  function preventDefaults (e) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleFiles(files, handleFileCallback) {
    files = [...files];
    files.forEach(file => file.arrayBuffer().then(buffer => handleFileCallback(buffer)));
  }
  
  function handleDrop(e) {
    var dt = e.dataTransfer;
    var files = dt.files;
    handleFiles(files, handleFileCallback);
  }

  function highlight(e) {
    dropArea.classList.add('highlight');
  }

  function unhighlight(e) {
    dropArea.classList.remove('highlight');
  }
  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight drop area when item is dragged over it
  ['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false)
  });

  // Handle dropped files
  dropArea.addEventListener('drop', handleDrop, false);

  fileElem.onchange = function() {
    handleFiles(fileElem.files, handleFileCallback);
  }
}