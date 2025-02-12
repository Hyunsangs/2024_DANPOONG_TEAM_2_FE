import { useState, useEffect, useRef } from "react";
// import { propsType } from "./searchBar/SearchBar";
import { Map, MapMarker } from "react-kakao-maps-sdk";
import { useNavigate } from "react-router-dom";
import markerIcon from "../../assets/map/markerIcon.svg";
import { storeSearch } from "../../apis/storeSearch";
import { useMarkerStore } from "../../stores/useMarkerStore";

// head에 작성한 Kakao API 불러오기
const { kakao } = window as any;

export interface propsType {
  searchKeyword: string;
  selectedFilters: string[]; // selectedFilters 속성 추가
}
const Maps = ({ searchKeyword, selectedFilters }: propsType) => {
  const navigator = useNavigate();
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const mapRef = useRef<kakao.maps.Map>(null);
  const { setGlobalMarkers } = useMarkerStore();

  // 초기 지도 중심 : 카카오 판교 아지트
  const initial_lat = 37.39556485367976;
  const initial_lng = 127.1104141120098;

  // 검색어가 바뀔 때마다 재렌더링되도록 useEffect 사용
  useEffect(() => {
    if (!map) return;
    console.log("현재 선택된 필터: ", selectedFilters);
    // 검색 결과 목록이나 마커를 클릭했을 때 장소명을 표출할 인포윈도우 생성

    searchPlaces();

    function searchPlaces() {
      const keyword = searchKeyword;

      if (!keyword.trim()) {
        console.log("키워드를 입력해주세요!");
        return;
      }

      // 키워드에 따른 상점 검색
      const getStores = async (keyword: string) => {
        try {
          const response = await storeSearch(keyword); // 서버에서 데이터 검색
          if (response && response.data) {
            console.log("서버 API 검색 결과:", response.data);
            if (response.data.length <= 0) {
              alert("검색 결과가 없습니다!");
              return;
            }
            placesSearchCB(response.data); // 검색 결과를 placesSearchCB로 전달
          } else {
            console.log("No response data:", response);
          }
        } catch (error) {
          console.error("Error: 검색 요청 실패", error);
        }
      };

      getStores(keyword); // getStores 실행
    }

    // 장소 검색 완료 후 호출되는 콜백 함수
    function placesSearchCB(data: any[]) {
      const bounds = new kakao.maps.LatLngBounds();
      // 기존 마커 제거
      removeMarker();

      // 필터링된 마커 데이터
      const filteredMarkers = data
        .map((place) => {
          if (selectedFilters.includes(place.certifiedType[0])) {
            const position = new kakao.maps.LatLng(place.y, place.x);
            const marker = addMarker(position, place.storeId);
            bounds.extend(position);
            return marker;
          }
          return null;
        })
        .filter((marker) => marker !== null); // null 값 제거

      if (filteredMarkers.length === 0) {
        // 필터에 해당하는 마커가 없을 경우 경고창과 전체 마커 표시
        alert(
          "해당 가치를 추구하는 가게가 없습니다. 전체 검색 결과를 표시합니다."
        );
        // 전체 검색 결과 마커 데이터
        const allMarkers = data.map((place) => {
          const position = new kakao.maps.LatLng(place.y, place.x);
          const marker = addMarker(position, place.storeId);
          bounds.extend(position);
          return marker;
        });
        setMarkers(allMarkers); // 전체 마커 표시
        setGlobalMarkers(allMarkers);
      } else {
        // 필터에 해당하는 마커가 있을 경우 해당 마커 표시
        setMarkers(filteredMarkers);
        setGlobalMarkers(filteredMarkers);
      }

      // 지도 범위를 모든 마커에 맞게 설정
      map?.setBounds(bounds);
    }

    // 마커를 생성하고 지도 위에 마커를 표시하는 함수
    function addMarker(position: any, storeId: number) {
      const markerImage = new kakao.maps.MarkerImage(
        markerIcon,
        new kakao.maps.Size(14, 14)
      );

      const marker = new kakao.maps.Marker({
        position,
        image: markerImage,
      });

      (marker as any).storeId = storeId;

      marker.setMap(map); // 지도 위에 마커를 표시
      return marker;
    }

    // 지도 위에 표시되고 있는 마커를 모두 제거
    function removeMarker() {
      markers.forEach((marker) => marker.setMap(null)); // 지도에서 제거
      setMarkers([]); // 상태 초기화
    }
  }, [searchKeyword, map, selectedFilters]);

  return (
    <Map
      ref={mapRef}
      onCreate={setMap}
      center={{ lat: initial_lat, lng: initial_lng }}
      style={{ width: "100%", height: "100%" }}
    >
      {markers.map((marker) => (
        <MapMarker
          key={marker.storeId}
          image={{ src: markerIcon, size: { width: 15, height: 15 } }}
          position={{
            lat: marker.getPosition().getLat(),
            lng: marker.getPosition().getLng(),
          }}
          onClick={() => navigator(`/map/${marker.storeId}`)}
        />
      ))}
    </Map>
  );
};

export default Maps;
