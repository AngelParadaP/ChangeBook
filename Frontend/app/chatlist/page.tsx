import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faComment } from "@fortawesome/free-solid-svg-icons";

interface ChatsModalProps {
  closeModal: () => void;
}

const ChatsModal: React.FC<ChatsModalProps> = (props) => {
  const [userChats, setUserChats] = useState<{ roomId: string; otherUserName: string; profileImage: string | null }[]>([]);
  const router = useRouter();
  const codigoUsuario = localStorage.getItem("codigoUsuario");

  const fetchUserChats = async () => {
    if (!codigoUsuario) return;

    try {
      const response = await axios.get(`/api/chat/rooms?codigoUsuario=${codigoUsuario}`);
      const rooms = response.data;
      const filteredRooms = rooms.filter((room: { split: (arg0: string) => [any, any]; }) => {
        const [user1, user2] = room.split("-");
        return user1 === codigoUsuario || user2 === codigoUsuario;
      });

      const userChatsWithNames = await Promise.all(
        filteredRooms.map(async (room: string) => {
          const [user1, user2] = room.split("-");
          const otherUserCodigo = user1 === codigoUsuario ? user2 : user1;
          const otherUserResponse = await axios.get(`api/user/get/${otherUserCodigo}`);
          const { nombre: otherUserName, imagenPerfil: profileImage } = otherUserResponse.data;
          return { roomId: room, otherUserName, profileImage: profileImage || null };
        })
      );

      setUserChats(userChatsWithNames);
    } catch (error) {
      console.error("Error fetching user chats:", error);
    }
  };

  useEffect(() => {
    fetchUserChats();
  }, [codigoUsuario]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black opacity-50" onClick={props.closeModal}></div>
      <div className="bg-white p-6 rounded-lg shadow-lg z-10 w-full max-w-3xl h-5/6 flex flex-col">
        <div className="flex items-center justify-between col-span-8 row-span-1 mt-3 mr-3 mb-4 border-gray-200 border-2 bg-gradient-to-r from-cbookC-400 via-cbookC-600 to-cbookC-700 rounded-2xl shadow-xl p-4">
          <h2 className="text-white font-semibold text-lg">Chats</h2>
          <button className="text-white" onClick={props.closeModal}>
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)]">
          {userChats.map((chat, index) => (
            <div
              key={index}
              className="p-4 border-b cursor-pointer flex items-center rounded-full bg-gray-100 m-2"
              onClick={() => {
                props.closeModal();
                router.push(`/chat?roomId=${chat.roomId}`);
              }}
            >
              {chat.profileImage ? (
                <img
                  src={chat.profileImage}
                  alt={`${chat.otherUserName}'s profile`}
                  className="w-10 h-10 rounded-full mr-4"
                />
              ) : (
                <img
                  loading="lazy"
                  src="/no-user.png"
                  alt="Imagen de perfil"
                  className="w-10 h-10 rounded-full mr-4"
                />
              )}
              <span className="flex-grow">{chat.otherUserName}</span>
              <div className="rounded-full bg-white p-2 shadow-md">
                <FontAwesomeIcon icon={faComment} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatsModal;
