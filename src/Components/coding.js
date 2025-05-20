import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import CodingForm from './CodingForm';
import FooterNav from './FooterNav';
import TikTokEmbed from './TikTokEmbed';
import TikTokMetadata from './MetaData';
import CoderNameInput from './CoderName';
import { Modal, Button } from 'react-bootstrap'; // ✅ Import Bootstrap modal
import Split from 'react-split';
import { GripVertical } from 'react-bootstrap-icons';
import ReactDOM from 'react-dom';



export default function TikTokCodingTool() {
	// Track coder identity and validation
	const [previousCoderName, setPreviousCoderName] = useState('');
	const [showWarningModal, setShowWarningModal] = useState(false); // ✅ updated

	// Navigation and video dataset state
	const [currentIndex, setCurrentIndex] = useState(0);
	const [videos, setVideos] = useState([]);

	// Load and parse CSV dataset on mount
	useEffect(() => {
		fetch('/data/tiktok_data.csv')
			.then(res => res.text())
			.then(csv => {
				Papa.parse(csv, {
					error: (err) => console.error("CSV parse error:", err),
					header: true,
					skipEmptyLines: true,
					complete: (results) => {
						const cleaned = results.data
							.filter(v => v.id && v.webVideoUrl)
							.map((v) => ({
								id: v.id,
								url: v.webVideoUrl,
								metadata: {
									description: v.text,
									author: v.author_name,
									like_count: Number(v.diggCount),
									view_count: Number(v.playCount),
									comment_count: Number(v.commentCount),
									share_count: Number(v.shareCount),
									save_count: Number(v.collectCount),
									create_time: new Date(Number(v.createTime) * 1000).toLocaleString(),
								}
							}));
						setVideos(cleaned);
					}
				});
			});
	}, []);

	// Dynamically load TikTok embed script on video change
	useEffect(() => {
		const script = document.createElement('script');
		script.src = 'https://www.tiktok.com/embed.js';
		script.async = true;
		document.body.appendChild(script);
		return () => {
			document.body.removeChild(script);
		};
	}, [currentIndex]);


	// Initialize default coding schema
	const [categories, setCategories] = useState({
		'Type of Video': ['Funny', 'Happy', 'Sad'],
	});

	// Track coder input and prior saved responses
	const [coderName, setCoderName] = useState('');
	const [responses, setResponses] = useState(() => {
		const stored = localStorage.getItem('responses');
		return stored ? JSON.parse(stored) : {};
	});

	// Guard render until data is loaded
	if (!videos.length) return <div className='p-4'>Loading videos...</div>;

	// Access current video and response state
	const currentVideo = videos[currentIndex];
	const currentResponse = responses[currentVideo.id]?.[coderName] || {};

	// Save updated responses to localStorage
	const saveResponses = (updatedResponses) => {
		setResponses(updatedResponses);
		localStorage.setItem('responses', JSON.stringify(updatedResponses));
	};

	// Add new code categories dynamically
	const addCategory = (name) => {
		if (!categories[name]) {
			setCategories({ ...categories, [name]: [] });
		}
	};

	// Add new options to a code category
	const addResponseOption = (category, option) => {
		if (categories[category] && !categories[category].includes(option)) {
			setCategories({
				...categories,
				[category]: [...categories[category], option],
			});
		}
	};

	// Update current coder's response for the video
	const updateResponse = (category, values) => {
		if (!coderName.trim()) {
			setShowWarningModal(true); // ✅ show modal if no coder
			return;
		}
		const updated = {
			...responses,
			[currentVideo.id]: {
				...(responses[currentVideo.id] || {}),
				[coderName]: {
					...(responses[currentVideo.id]?.[coderName] || {}),
					[category]: values,
				},
			},
		};
		saveResponses(updated);
	};

	// Track freeform notes
	const handleNoteChange = (e) => {
		if (!coderName.trim()) {
			setShowWarningModal(true); // ✅ show modal if no coder
			return;
		}
		const updated = {
			...responses,
			[currentVideo.id]: {
				...(responses[currentVideo.id] || {}),
				[coderName]: {
					...(responses[currentVideo.id]?.[coderName] || {}),
					notes: e.target.value,
				},
			},
		};
		saveResponses(updated);
	};

	// Navigation with coder name required
	const goToVideo = (newIndex) => {
		if (!coderName.trim()) {
			setShowWarningModal(true); // ✅ show modal if no coder
			return;
		}
		setCurrentIndex(newIndex);
	};

	// Track prior coders to allow re-selection
	const previousCoders = Array.from(new Set(Object.values(responses).flatMap(v => Object.keys(v))));

	return (
		<div className="d-flex flex-column vh-100" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
			{/* Main content container */}
			<div className="container-fluid flex-grow-1 d-flex flex-column h-100" style={{ flex: 1, height: '100vh', overflow: 'hidden' }}>
				{/* Header row */}
				<div className="row justify-content-between align-items-center border-bottom p-3">
					<CoderNameInput
						coderName={coderName}
						setCoderName={setCoderName}
						previousCoderName={previousCoderName}
						setPreviousCoderName={setPreviousCoderName}
						previousCoders={previousCoders}
						showWarningModal={showWarningModal}
						setShowWarningModal={setShowWarningModal}
					/>
				</div>

				<Split
					className="flex-grow-1 d-flex"
					style={{ height: '100%' }}
					sizes={[66, 34]}
					minSize={200}
					gutterSize={12}
					direction="horizontal"
					gutter={() => {
						const gutter = document.createElement('div');
						gutter.className = 'custom-gutter d-flex align-items-center me-2';

						const icon = document.createElement('div');
						icon.className = 'gutter-icon h2 me-2 mb-0';
						icon.textContent = '⋮';
						gutter.appendChild(icon);

						return gutter;
					}}
				>
					{/* Left column (Video + Metadata) */}
					<div className="d-flex flex-column h-100 w-100">
						<div className="row flex-grow-1 h-100">
						{/* TikTok Embed */}
						<div className="col-md-6 d-flex flex-column h-100">
							<div
								className="p-3"
								style={{
									flex: 1,
									minHeight: 0,
									overflow: 'auto',
									maxHeight: '100%',
								}}
								>
								<div style={{ height: 'calc(100vh - 200px)', overflow: 'auto' }}>
									<TikTokEmbed video={currentVideo} />
								</div>
							</div>

						</div>

						{/* Metadata */}
						<div className="col-md-6 overflow-auto p-3 h-100">
							<TikTokMetadata metadata={currentVideo.metadata} />
						</div>
						</div>
					</div>

					{/* Right column (Form) */}
					<div className="border-start overflow-auto p-3 h-100">
						<CodingForm
						categories={categories}
						currentResponse={currentResponse}
						coderName={coderName}
						setShowWarning={setShowWarningModal}
						addResponseOption={addResponseOption}
						addCategory={addCategory}
						updateResponse={updateResponse}
						handleNoteChange={handleNoteChange}
						/>
					</div>
				</Split>

				{/* Footer Navigation */}
				<div className="row justify-content-between align-items-center border-top p-3">
					<FooterNav
						coderName={coderName}
						currentIndex={currentIndex}
						videos={videos}
						goToVideo={goToVideo}
					/>
				</div>
			</div>

			{/* Warning Modal */}
			<Modal show={showWarningModal} onHide={() => setShowWarningModal(false)} centered>
				<Modal.Header closeButton>
					<Modal.Title>Coder Name Required</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					Please enter your coder name before tagging or making notes.
				</Modal.Body>
				<Modal.Footer>
					<Button variant="primary" onClick={() => setShowWarningModal(false)}>
						OK
					</Button>
				</Modal.Footer>
			</Modal>
		</div>
	);
}
