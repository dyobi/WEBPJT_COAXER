import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BiXCircle } from 'react-icons/bi';
import $ from 'jquery';

import Chatroom from './chatroom';
import Profile from '../../util/pullUser';
import Interceptor from '../../util/interceptor';
import { getChatroom } from '../../../datas';
import { user_chat } from '../../../store/actions';
import { stomp } from '../../app';

import './index.css';

const Component = () => {

	const _ui = useSelector(state => state.ui);
	const _user = useSelector(state => state.user);
	const dispatch = useDispatch();

	const [profile, setProfile] = useState(undefined);
	const [chatIdx, setChatIdx] = useState(-1);

	const _handleChatroom = (setVal) => {
		if (setVal) {
			$('.chat_list').css('width', '60%');
			$('.chat_delete_btn').css('visibility', 'hidden');
			$('.chat_delete_btn').css('opacity', '0');
			$('.chatroom').css('flex-basis', '100%');
		} else {
			$('.chat_list').css('width', '100%');
			$('.chat_delete_btn').css('visibility', 'visible');
			$('.chat_delete_btn').css('opacity', '1');
			$('.chatroom').css('flex-basis', '0');
		}
	};

	const _handleViewProfile = (e, setVal) => {
		e.stopPropagation();
		if (setVal) {
			$('.chat_list').css('flex-basis', '0');
			$('.pull_user_container').css('flex-basis', '100%');
		} else {
			$('.chat_list').css('flex-basis', '100%');
			$('.pull_user_container').css('flex-basis', '0');
		}
	};

	const _handleDeleteChat = (e) => {
		e.stopPropagation();
		console.log('delete');
	};

	const showChat = (msg) => {

		let appendedChat = _user.chat;

		for (let i = 0; i < appendedChat.length; i++) {
			if (appendedChat[i].id === msg.roomId) {
				appendedChat[i].messages.push({
					id: -1,
					sender: { id: msg.sender },
					content: msg.content,
					sendDate: ''
				});
				break;
			}
		}

		dispatch(user_chat(appendedChat));

	};

	$(() => {
		if (_user.isComplete && profile !== undefined) {
			const slider = document.querySelector('.chat_list');
			let isDown = false;
			let startY;
			let scrollTop;

			slider.addEventListener('mousedown', (e) => {
				isDown = true;
				slider.classList.add('active');
				startY = e.pageY - slider.offsetTop;
				scrollTop = slider.scrollTop;
			});

			slider.addEventListener('mouseleave', () => {
				isDown = false;
				slider.classList.remove('active');
			});

			slider.addEventListener('mouseup', () => {
				isDown = false;
				slider.classList.remove('active');
			});

			slider.addEventListener('mousemove', (e) => {
				e.preventDefault();
				if (!isDown) return;
				const y = e.pageY - slider.offsetTop;
				const walk = (y - startY) * 1.2;
				slider.scrollTop = scrollTop - walk;
			});
		}
	});

	useEffect(() => {
		if (_user.id !== -1) {
			getChatroom(_user.id, res => {
				if (res.status === 200) {
					dispatch(user_chat(res.obj));
					if (stomp !== undefined) {
						for (let i = 0; i < res.obj.length; i++) {
							if (stomp._stompHandler._subscriptions[res.obj[i].id] === undefined) {
								stomp.subscribe('/room/' + res.obj[i].id, (msg) => {
									showChat(JSON.parse(msg.body));
								}, { id: res.obj[i].id });
							}
						}
					}
				} else {
					console.log('handle err')
				}
			});
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [_user.id]);

	return (
		<div className='chat_container'>
			{_user.id === -1 || !_user.isComplete ?
				<Interceptor />
				:
				<>
					<Profile
						usingFor='chat'
						user={profile}
					/>
					<div className='chat_list'>
						{_user.chat.length > 0 ?
							_user.chat.map((chat, idx) => {

								let user = chat.user1.id === _user.id ? chat.user2 : chat.user1;
								let message = chat.messages;

								return (
									<div className='chat_list_each'
										key={idx}
										onClick={async () => {
											await setChatIdx(idx);
											_handleChatroom(true);
										}}
									>
										{user.pictures.length > 0 ?
											<img
												src={process.env.PUBLIC_URL + `/tmp/${user.pictures[0].name}.${user.pictures[0].type}`}
												alt=''
												onClick={async (e) => {
													e.stopPropagation();
													await setProfile(user);
													_handleViewProfile(e, true);
												}}
											/>
											:
											''
										}
										<div className='chat_thumbnail_container'>
											{_ui.lang === 'en_US' ?
												<p>{user.firstName} {user.lastName}</p>
												:
												<p>{user.lastName} {user.firstName}</p>
											}
											{chat.messages.length > 0 ?
												<span>{message[message.length - 1].content}</span>
												:
												''
											}
										</div>
										<div className='chat_delete_container'>
											<BiXCircle className='chat_delete_btn' onClick={(e) => _handleDeleteChat(e)} />
										</div>
									</div>
								);
							})
							:
							''
						}
					</div>
					<Chatroom index={chatIdx} />
				</>
			}
		</div>
	);
};

export default Component;