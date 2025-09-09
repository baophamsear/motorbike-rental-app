import axios from 'axios';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiYmFvcGhhbTAxMTAiLCJhIjoiY21leTc3dmdvMWVoNTJrcHlvY29xODZkYSJ9.vnT3usPvz6o6c-7X10sSmw';

export const geocodeAddress = async (address) => {
  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`,
      {
        params: {
          access_token: MAPBOX_TOKEN,
          limit: 1,
        },
      }
    );

    const result = response.data.features[0];
    if (!result) return null;

    const [longitude, latitude] = result.center;

    return {
      latitude,
      longitude,
      placeName: result.place_name,
    };
  } catch (error) {
    console.error('Error during geocoding:', error);
    return null;
  }
};
