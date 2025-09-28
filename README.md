# Editora™ - Fast and Simple WYSIWYG Editor
Editora™ is a JavaScript-based WYSIWYG HTML editor that runs in the browser, letting anyone edit content easily, fast, and intuitively.  
Because it’s built with plain HTML and JavaScript, you can freely extend and customize it.

## Include Editora™ in your project
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"/>
```
Add the **Bootstrap** and **Font Awesome** CDN
```html
<script src="editor_modular.js"></script>
```
Load the <code>editor_moduler.js</code> 
```html
<div id="editor-container"></div>
<textarea name="content" id="hiddenTextarea" style="display: none"></textarea>
```
Insert the <code>div</code> and <code>textarea</code> elements.
```js
document.addEventListener("DOMContentLoaded", () => {
        const editorContainer = document.getElementById("editor-container");
        const form = document.getElementById("my-form");
        const formDataOutput = document.querySelector("#form-data code");
        const myEditor = createEditor(editorContainer);
      });
```
Initialize the editor when the DOM is ready.
### Demo
```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"/>
    <link rel="stylesheet" href="editor.css" />
  </head>
  <body>
      <form id="my-form" class="mt-4">
        <div id="editor-container"></div>
        <textarea name="content" id="hiddenTextarea" style="display: none"></textarea>
      </form>
    </div>

    <script src="editor_modular.js"></script>
    <script>
      document.addEventListener("DOMContentLoaded", () => {
        const editorContainer = document.getElementById("editor-container");
        const form = document.getElementById("my-form");
        const formDataOutput = document.querySelector("#form-data code");
        const myEditor = createEditor(editorContainer);
      });
    </script>
  </body>
</html>
```
## ETC
* If you encounter bugs or issues during installation, please open an Issue.
