// Função para buscar dados de Riven usando a API do Flask
async function fetchRivenData(weapon = null) {
    let url;

    // Construindo a URL com base no parâmetro de arma
    if (weapon) {
        const weaponEncoded = encodeURIComponent(weapon);
        url = `http://localhost:8000/api/rivens?weapon=${weaponEncoded}`;
    } else {
        url = 'http://localhost:8000/api/rivens'; // Sem filtro de arma
    }

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Request error: ${response.status}`);
        }

        const data = await response.json();
        console.log("DATA OBTAINED FROM FLASK", weapon, data);
        return data;
    } catch (error) {
        console.error('Error fetching API data:', error);
        return { error: 'Unable to fetch data from the API.', details: error.message };
    }
}
