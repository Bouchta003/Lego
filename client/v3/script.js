document.addEventListener("DOMContentLoaded", async () => {
    // Example API endpoint (replace this with your actual API URL)
    const apiUrl = "https://legoali.vercel.app/deals";
  
    try {
      // Fetch data from the API
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const data = await response.json(); // Assuming API returns an array of { url: "..." }
  
      // Get all <a> elements on the page
      const links = document.querySelectorAll("a");
  
      // Replace the href of each link with the URLs from the API
      links.forEach((link, index) => {
        if (data[index] && data[index].url) {
          link.href = data[index].url;
          link.textContent = `Updated Link ${index + 1}`; // Optional: Update link text
        }
      });
  
      console.log("Links updated successfully!");
    } catch (error) {
      console.error("Error fetching or updating links:", error);
    }
  });
  