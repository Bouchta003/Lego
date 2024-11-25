async function FetchHtml() 
    {
        let response = await fetch('https://address.com');
        return await response.text(); // Returns it as Promise
    }
        
        
async function Do()
    {
    let html = await FetchHtml().then(text => {return text}); // Get html from the promise
    alert(html);
    }

Do();
